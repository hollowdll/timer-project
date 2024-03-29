//----------------------------------------------------//
// This script runs before rendered process is loaded //
//--------------------------------------------------- //

// Can access DOM APIs + node.js
// Main process cannot access DOM APIs like window and document
// We need to attach this script to the renderer process to access them via Inter Process Communication (IPC)

// Read more about preload.js file:
// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload


const { contextBridge, ipcRenderer } = require("electron");

// Dark mode API
/*  Disabled
contextBridge.exposeInMainWorld("darkMode", {
    toggle: () => ipcRenderer.invoke("dark-mode:toggle"),
    system: () => ipcRenderer.invoke("dark-mode:system"),
})
*/

// Keyboard shortcut API
contextBridge.exposeInMainWorld("keyboardShortcuts", {
    // These are event listeners in the renderer process
    onKeyboardShortcut: (message) => ipcRenderer.on("keyboard-shortcut", message),
})

// Window creating API
contextBridge.exposeInMainWorld("windowCreator", {
    createNewWindow: (message, data) => ipcRenderer.invoke("create-new-window", message, data),
    onWindowCreated: (callback) => ipcRenderer.on("new-window-created", callback),
    
})

// App file system API
contextBridge.exposeInMainWorld("appFileSystem", {
    // Request renderers to send window data to main process to save a file
    getTimerData: (callback) => ipcRenderer.on("get-timer-data", callback),
    getTimerAndSplitsData: (callback) => ipcRenderer.on("get-timer-and-splits-data", callback),

    // Load savefiles in savefile opener window
    loadSavefileData: (callback) => ipcRenderer.on("load-savefile-data", callback),
    createWindowFromSavefile: (message, data) => ipcRenderer.invoke("create-window-from-savefile", message, data),
})