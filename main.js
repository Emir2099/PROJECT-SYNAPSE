const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

const execPromise = util.promisify(exec);
const store = new Store();

// Configure auto-updater
autoUpdater.autoDownload = false; // Manual download for user control
autoUpdater.autoInstallOnAppQuit = true;

console.log('=== AUTO-UPDATER INITIALIZED ===');
console.log('App version:', app.getVersion());
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    frame: false,
    title: 'Project Synapse',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile('renderer.html');

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after window is ready
  setTimeout(() => {
    checkForUpdates();
  }, 3000); // Wait 3 seconds after launch

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ===== WINDOW CONTROLS =====

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ===== AUTO-UPDATE SYSTEM =====

function checkForUpdates() {
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    console.log('Skipping update check in development mode');
    return;
  }
  
  autoUpdater.checkForUpdates().catch(err => {
    console.error('Error checking for updates:', err);
  });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  console.log('Update info:', JSON.stringify(info, null, 2));
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No updates available');
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj.percent.toFixed(2) + '%');
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

// IPC handlers for update actions
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result.updateInfo };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    console.log('=== DOWNLOAD UPDATE REQUESTED ===');
    console.log('Starting update download...');
    
    // Add a small delay to ensure the download event handlers are ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const downloadPromise = autoUpdater.downloadUpdate();
    console.log('Download promise created');
    
    const result = await downloadPromise;
    console.log('Download completed:', result);
    return { success: true };
  } catch (error) {
    console.error('=== DOWNLOAD ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', 'Download failed: ' + error.message);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-current-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-releases', async () => {
  try {
    const releasesPath = path.join(__dirname, 'RELEASES.md');
    const content = await fs.readFile(releasesPath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Error reading releases:', error);
    return { success: false, error: error.message };
  }
});

// ===== DATA MANAGEMENT =====

// Get all projects
ipcMain.handle('get-projects', async () => {
  try {
    const projects = store.get('projects', []);
    return { success: true, data: projects };
  } catch (error) {
    console.error('Error getting projects:', error);
    return { success: false, error: error.message };
  }
});

// Save project (add or update)
ipcMain.handle('save-project', async (event, project) => {
  try {
    const projects = store.get('projects', []);
    
    if (project.id) {
      // Update existing project
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...project };
      } else {
        return { success: false, error: 'Project not found' };
      }
    } else {
      // Add new project
      project.id = 'p' + Date.now();
      project.createdAt = new Date().toISOString();
      projects.push(project);
    }
    
    store.set('projects', projects);
    return { success: true, data: project };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
});

// Delete project
ipcMain.handle('delete-project', async (event, projectId) => {
  try {
    const projects = store.get('projects', []);
    const filtered = projects.filter(p => p.id !== projectId);
    store.set('projects', filtered);
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
});

// ===== FILE SYSTEM OPERATIONS =====

// Open folder in file explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening folder:', error);
    return { success: false, error: error.message };
  }
});

// Run executable or command
ipcMain.handle('run-command', async (event, command) => {
  try {
    // Check if it's a file path that exists
    const isFilePath = command.includes(':') || command.includes('/') || command.includes('\\');
    
    if (isFilePath) {
      // If it's an executable file
      if (command.endsWith('.exe') || command.endsWith('.app')) {
        await shell.openPath(command);
      } else {
        // Try to execute as shell command
        const { stdout, stderr } = await execPromise(command, { shell: true });
        console.log('Command output:', stdout);
        if (stderr) console.error('Command error:', stderr);
      }
    } else {
      // Execute as shell command
      const { stdout, stderr } = await execPromise(command, { shell: true });
      console.log('Command output:', stdout);
      if (stderr) console.error('Command error:', stderr);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error running command:', error);
    return { success: false, error: error.message };
  }
});

// Open external link
ipcMain.handle('open-external-link', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Error opening external link:', error);
    return { success: false, error: error.message };
  }
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});

// Select file dialog
ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting file:', error);
    return { success: false, error: error.message };
  }
});

// Check if path exists
ipcMain.handle('check-path-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch (error) {
    return { success: true, exists: false };
  }
});

// ===== GITHUB API =====

// Fetch GitHub repo info
ipcMain.handle('fetch-github-info', async (event, repoUrl) => {
  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return { success: false, error: 'Invalid GitHub URL' };
    }
    
    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');
    
    // Get GitHub token from settings
    const settings = store.get('settings', {});
    const headers = {};
    if (settings.githubToken) {
      headers['Authorization'] = `token ${settings.githubToken}`;
    }
    
    // Fetch repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoResponse.ok) {
      throw new Error('Failed to fetch repository info');
    }
    const repoData = await repoResponse.json();
    
    // Fetch latest commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`, { headers });
    let lastCommit = null;
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json();
      if (commits.length > 0) {
        lastCommit = {
          message: commits[0].commit.message,
          date: commits[0].commit.author.date,
          author: commits[0].commit.author.name
        };
      }
    }
    
    // Fetch releases
    const releasesResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/releases?per_page=5`, { headers });
    let releases = [];
    if (releasesResponse.ok) {
      const releasesData = await releasesResponse.json();
      releases = releasesData.map(r => ({
        tag: r.tag_name,
        name: r.name,
        date: r.published_at,
        downloadUrl: r.html_url
      }));
    }
    
    // Fetch pull requests
    const prsResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls?state=open`, { headers });
    let openPRs = 0;
    if (prsResponse.ok) {
      const prs = await prsResponse.json();
      openPRs = prs.length;
    }
    
    return {
      success: true,
      data: {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        lastCommit,
        releases,
        openPRs
      }
    };
  } catch (error) {
    console.error('Error fetching GitHub info:', error);
    return { success: false, error: error.message };
  }
});

// ===== SETTINGS =====

// Get settings
ipcMain.handle('get-settings', async () => {
  try {
    const settings = store.get('settings', {});
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { success: false, error: error.message };
  }
});

// Save settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    store.set('settings', settings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
});

// ===== DATA EXPORT/IMPORT =====

// Export data
ipcMain.handle('export-data', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Project Data',
      defaultPath: 'project-synapse-backup.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    const data = {
      projects: store.get('projects', []),
      settings: store.get('settings', {}),
      exportDate: new Date().toISOString()
    };
    
    await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
});

// Import data
ipcMain.handle('import-data', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Project Data',
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    const fileContent = await fs.readFile(result.filePaths[0], 'utf8');
    const data = JSON.parse(fileContent);
    
    if (data.projects) {
      store.set('projects', data.projects);
    }
    if (data.settings) {
      store.set('settings', data.settings);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
});
