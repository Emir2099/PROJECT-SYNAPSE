const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
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
  importData: () => ipcRenderer.invoke('import-data')
});
