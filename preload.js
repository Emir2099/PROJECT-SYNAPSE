const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Project management
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (project) => ipcRenderer.invoke('save-project', project),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  
  // File system operations
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  checkPathExists: (filePath) => ipcRenderer.invoke('check-path-exists', filePath),
  
  // GitHub API
  fetchGithubInfo: (repoUrl) => ipcRenderer.invoke('fetch-github-info', repoUrl),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Data export/import
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Auto-update system
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  getReleases: () => ipcRenderer.invoke('get-releases'),
  
  // Update event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, data) => callback(data)),
  onUpdateDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (event, data) => callback(data)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, data) => callback(data)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (event, data) => callback(data))
});
