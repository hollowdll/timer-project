//------------------------------//
// Main process of electron app //
//------------------------------//

// Get modules
const { app, BrowserWindow, ipcMain, globalShortcut, nativeTheme } = require("electron");
const path = require("path");

// Keep track of app windows
let appWindowData = {
    appWindows: {},
}

// Function for creating main window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 500,
        webPreferences: {
            // preload script
            preload: path.join(__dirname, "preload.js"),
            // Enable sandboxing for the renderer. Read: https://www.electronjs.org/docs/latest/tutorial/sandbox
            sandbox: true,
            show: false
        }
    });

    // Set window title
    mainWindow.setTitle("Timer Program");

    // Edit topbar menus
    

    // Set background color
    mainWindow.setBackgroundColor("rgb(155, 155, 155)");

    // Set window properties


    // Show window after the renderer has loaded if not shown yet
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    })

    // Load the window contents
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    // (Development mode) open DevTools
    // mainWindow.webContents.openDevTools(); 

    return mainWindow;
}

const createTimerWindow = () => {
    const createdWindow = new BrowserWindow({
        width: 400,
        height: 250,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    createdWindow.setTitle("Timer");
    createdWindow.loadFile(path.join(__dirname, "html", "timer.html"));

    return createdWindow;
}

const createTimerAndSplitsWindow = async (data) => {
    const createdWindow = new BrowserWindow({
        width: 350,
        height: 550,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    // Set properties
    if (typeof data.activity === "string") createdWindow.setTitle(data.activity);
    createdWindow.setResizable(false);
    createdWindow.setFullScreenable(false);

    // Wait for window contents to load
    await createdWindow.loadFile(path.join(__dirname, "html", "timer-and-splits.html"));

    // Send data to the new renderer process
    createdWindow.webContents.send("new-window-created", data);

    return createdWindow;
}

const createSavefileOpenerWindow = () => {
    const createdWindow = new BrowserWindow({
        width: 600,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    createdWindow.setTitle("Open a savefile");
    createdWindow.setBackgroundColor("rgb(155, 155, 155)");

    createdWindow.loadFile(path.join(__dirname, "html", "savefile-opener.html"));

    return createdWindow;
}

const createSplitEditorWindow = () => {
    const createdWindow = new BrowserWindow({
        width: 600,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    createdWindow.setTitle("Split Editor");
    createdWindow.loadFile(path.join(__dirname, "html", "split-editor.html"));

    return createdWindow;
}

const createLayoutEditorWindow = () => {

}

const createSettingsWindow = () => {

}

// Function for handling IPC messages from the renderer process
const handleIpcMessages = () => {
    // Dark mode
    ipcMain.handle("dark-mode:toggle", () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light';
        } else {
            nativeTheme.themeSource = 'dark';
        }
        return nativeTheme.shouldUseDarkColors;
    });

    ipcMain.handle("dark-mode:system", () => {
        nativeTheme.themeSource = "system";
    });

    // Create new windows
    ipcMain.handle("create-new-window", (event, message, data) => {
        let createdWindow = null;
        let returnMessage = "Nothing returned";

        // Create the wanted window
        if (message === "new-timer") {
            createdWindow = createTimerWindow();
            appWindowData.appWindows["timer"] = createdWindow;
            returnMessage = "New timer";
        }
        else if (message === "new-split-editor") {
            createdWindow = createSplitEditorWindow();
            appWindowData.appWindows["split-editor"] = createdWindow;
            returnMessage = "New split editor";
        }
        else if (message === "new-timer-and-splits") {
            createdWindow = createTimerAndSplitsWindow(data);
            returnMessage = "New timer and splits";
        }
        else if (message === "new-savefile-opener") {
            createdWindow = createSavefileOpenerWindow();
            returnMessage = "New savefile opener";
        }

        
        if (createdWindow) {
            // do something
        }
        
        return returnMessage;
    });
}

// Execute after app's ready event. This initializes the app.
const initApp = () => {
    // Handle IPC messages from the renderer process
    handleIpcMessages();

    // Create main window
    const mainWindow = createMainWindow();

    // (macOS) If no windows are open, then create one
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    })

    // Close the app when all windows are closed (When not on macOS)
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {        // darwin = macOS
            console.log("Closing all windows...");
            console.log("Quitting app...");
            app.quit();
        }
    })

    // Register global keyboard shortcuts
    /*
    globalShortcut.register("Alt+K", () => {
        // Start/pause timer
        appWindows.mainWindow.webContents.send("timer-shortcut", "start/pause");
    })

    globalShortcut.register("Alt+R", () => {
        // Reset timer
        appWindows.mainWindow.webContents.send("timer-shortcut", "reset");
    })
    */

    // Do checks if necessary
    console.log("Node version:", process.versions["node"]);
    console.log("Chrome version:", process.versions["chrome"]);
    console.log("Electron version:", process.versions["electron"]);
}

// Wait for app module's ready event to initialize the app
app.whenReady().then(initApp);

