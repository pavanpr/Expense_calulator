const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Minimize window
  minimizeWindow: () => ipcRenderer.send('window-minimize'),

  // Maximize window
  maximizeWindow: () => ipcRenderer.send('window-maximize'),

  // Close window
  closeWindow: () => ipcRenderer.send('window-close'),

  // Listen for backend ready event
  onBackendReady: (callback) => {
    ipcRenderer.on('backend-ready', callback);
  },

  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform info
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development',
});
