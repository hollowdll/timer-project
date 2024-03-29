//------------------------------//
// Main process of electron app //
//------------------------------//

// Get modules
const { app, BrowserWindow, ipcMain, globalShortcut, nativeTheme, Menu, MenuItem } = require("electron");
const path = require("path");
const fs = require("fs");

// Keep track of app windows
const appWindowData = {
    appWindows: {
        mainWindow: null,
    },
    keyboardShortcuts: {
        isGlobalKeyboardShortcutsOn: false,
    }
}

// Fetch savefile data
const fetchSavefileData = () => {
    const savefileDir = path.join(process.cwd(), "savefiles");

    // If savefileDir exists
    if (fs.existsSync(savefileDir)) {
        // Get all file names and data
        try {
            const dataset = {};
            const fileNames = fs.readdirSync(savefileDir);

            if (fileNames.length > 0) {
                for (const file of fileNames) {
                    try {
                        const fileData = fs.readFileSync(path.join(savefileDir, file));

                        // Make sure the data is .json format
                        dataset[file] = JSON.parse(fileData);
                    } catch(err) {
                        // If the data is not .json, throw and handle error
                        console.log("Error reading file:", err);
                    }
                }
            } else {
                dataset = null;
            }

            // Return dataset with file names and data
            return dataset;
        } catch {
            console.log("Error reading directory");
            return;
        }
    }
}


// Register global shortcuts
const registerGlobalShortcuts = () => {
    const nextSplitShortcut = globalShortcut.register("CommandOrControl+Space", () => {
        // Check if global keyboard shortcuts are enabled
        if (appWindowData.keyboardShortcuts.isGlobalKeyboardShortcutsOn) {
            const allAppWindows = BrowserWindow.getAllWindows();

            for (const win of allAppWindows) {
                // Send shortcut request to all windows and let them handle the rest
                win.webContents.send("keyboard-shortcut", "next-split");
            }       
        }
    })

    // If registration fails or it is already used by another application
    if (!nextSplitShortcut) {
        console.log("Global Keyboard Shortcut registration failed");
    }
}

// Unregister global shortcuts
const unregisterGlobalShortcuts = () => {
    // Next split button
    if (globalShortcut.isRegistered("CommandOrControl+Space")) {
        globalShortcut.unregister("CommandOrControl+Space");
    }
}

// Trigger local shortcuts
const triggerLocalShortcuts = (shortcut) => {
    // Check if global keyboard shortcuts are disabled
    if (!appWindowData.keyboardShortcuts.isGlobalKeyboardShortcutsOn) {
        const allAppWindows = BrowserWindow.getAllWindows();

        for (const win of allAppWindows) {
            // Send shortcut request to all windows and let them handle the rest
            win.webContents.send("keyboard-shortcut", shortcut);
        }       
    }
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

    // Create Menu for this window
    const menuTemplate = [
        {
            label: "File",
            submenu: [
                { role: "quit" },
            ]
        },
        {
            label: "Edit",
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
                { type: 'separator' },
            ]
        },
        /*
        {
            label: 'View',
            submenu: [
              { role: 'toggleDevTools' },
              { role: "reload" },
            ]
        },
        */
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" }
            ]
        }
    ]

    // Set window menu
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    mainWindow.setMenu(windowMenu);

    // Set window title
    mainWindow.setTitle("Timer Program");

    // Set background color
    mainWindow.setBackgroundColor("rgb(40,40,40)");

    // Show window after the renderer has loaded if not shown yet
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    })

    // Load the window contents
    mainWindow.loadFile(path.join(__dirname, "index.html"));

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

    // Create Menu for this window
    const menuTemplate = [
        {
            label: "Edit",
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
                { type: 'separator' },
            ]
        },
        /*
        {
            label: 'View',
            submenu: [
              { role: 'toggleDevTools' },
            ]
        },
        */
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" }
            ]
        }
    ]

    // Set window menu
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    createdWindow.setMenu(windowMenu);

    createdWindow.setTitle("Timer");
    createdWindow.setBackgroundColor("rgb(40,40,40)");
    createdWindow.setResizable(false);
    createdWindow.setFullScreenable(false);

    createdWindow.loadFile(path.join(__dirname, "html", "timer.html"));

    return createdWindow;
}

const createTimerAndSplitsWindow = async (data) => {
    const createdWindow = new BrowserWindow({
        width: 375,
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
    createdWindow.setBackgroundColor("rgb(40,40,40)");
    
    // Create Menu for this window
    const menuTemplate = [
        {
            label: "File",
            submenu: [
                // Save a file
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => {
                        // Get savefile data from the renderer
                        createdWindow.webContents.send("get-timer-and-splits-data");
                    }
                },
                {
                    type: "separator",
                },

                // Keyboard shortcuts //
                {
                    label: "Toggle Keyboard Shortcuts",
                    submenu: [
                        {
                            id: "isGlobalKeyboardShortcutsOn",
                            label: "Global",
                            type: "radio",
                            checked: false,
                            click: () => {
                                appWindowData.keyboardShortcuts.isGlobalKeyboardShortcutsOn = true;
                                registerGlobalShortcuts();
                            }
                        },
                        {
                            label: "Local",
                            type: "radio",
                            checked: true,
                            click: () => {
                                appWindowData.keyboardShortcuts.isGlobalKeyboardShortcutsOn = false;
                                unregisterGlobalShortcuts();
                            }
                        }
                    ]
                },
                {
                    label: "Global Keyboard Shortcut List",
                    submenu: [
                        {
                            id: "next-split",
                            label: "Next Split",
                            accelerator: "CommandOrControl+Space",
                        }
                    ]
                },
                {
                    label: "Local Keyboard Shortcut List",
                    submenu: [
                        {
                            label: "Next Split",
                            accelerator: "CommandOrControl+Space",
                            click: () => {
                                triggerLocalShortcuts("next-split");
                            }
                        }
                    ]
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
                { type: 'separator' },
            ]
        },
        /*
        {
            label: 'View',
            submenu: [
              { role: 'toggleDevTools' },
            ]
        },
        */
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" }
            ]
        }
    ]

    // Set window menu
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    createdWindow.setMenu(windowMenu);

    // Check if global shortcuts are enabled when this window is created
    if (appWindowData.keyboardShortcuts.isGlobalKeyboardShortcutsOn) {
        const item = windowMenu.getMenuItemById("isGlobalKeyboardShortcutsOn");
        item.checked = true;
    }

    // Wait for window contents to load
    await createdWindow.loadFile(path.join(__dirname, "html", "timer-and-splits.html"));

    // Send data to the new renderer process
    createdWindow.webContents.send("new-window-created", data);

    return createdWindow;
}

const createSavefileOpenerWindow = async () => {
    const createdWindow = new BrowserWindow({
        // parent: appWindowData.appWindows.mainWindow,
        width: 600,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    // Create Menu for this window
    /*
    const menuTemplate = [
        {
            label: "Edit",
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
                { type: 'separator' },
            ]
        },
        
        {
            label: 'View',
            submenu: [
              { role: 'toggleDevTools' },
            ]
        },
        
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" }
            ]
        }
    ]
    */

    // Set window menu
    // const windowMenu = Menu.buildFromTemplate(menuTemplate);
    createdWindow.setMenu(null);

    createdWindow.setTitle("Open a savefile");
    createdWindow.setBackgroundColor("rgb(40,40,40)");

    await createdWindow.loadFile(path.join(__dirname, "html", "savefile-opener.html"));

    // Fetch savefile data
    const savefileData = fetchSavefileData();
    if (savefileData) {
        createdWindow.webContents.send("load-savefile-data", savefileData);
    }

    return createdWindow;
}

const createSplitEditorWindow = () => {
    const createdWindow = new BrowserWindow({
        // parent: appWindowData.appWindows.mainWindow,
        width: 600,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            sandbox: true,
        }
    });

    // Create Menu for this window
    /*
    const menuTemplate = [
        {
            label: "Edit",
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
                { type: 'separator' },
            ]
        },
        
        {
            label: 'View',
            submenu: [
              { role: 'toggleDevTools' },
            ]
        },
        
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" }
            ]
        }
    ]
    */

    // Set window menu
    // const windowMenu = Menu.buildFromTemplate(menuTemplate);
    createdWindow.setMenu(null);

    createdWindow.setTitle("Split Editor");
    createdWindow.setBackgroundColor("rgb(40,40,40)");
    createdWindow.setResizable(false);
    createdWindow.setFullScreenable(false);

    createdWindow.loadFile(path.join(__dirname, "html", "split-editor.html"));

    return createdWindow;
}

const createSettingsWindow = () => {

}

const createHowToUseWindow = () => {
    
}


// Function for handling IPC messages from the renderer process
const handleIpcMessages = () => {
    // Dark mode //
    /*
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
    */

    // Create new windows //
    ipcMain.handle("create-new-window", (event, message, data) => {
        let createdWindow = null;
        let returnMessage = "Nothing returned";

        // Create the wanted window
        if (message === "new-timer") {
            createdWindow = createTimerWindow();
            returnMessage = "New timer";
        }
        else if (message === "new-split-editor") {
            createdWindow = createSplitEditorWindow();
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
    

    //--------------------------------------------//
    // File System for creating and loading files //
    //--------------------------------------------//
    
    // Get savefile content and create a new savefile
    ipcMain.on("send-timer-and-splits-data", (_event, savefileValue, savefileName) => {
        // Create savefiles directory if it doesn't exist
        const savefilesDir = path.join(process.cwd(), "savefiles");
        if (!fs.existsSync(savefilesDir)) {
            fs.mkdirSync(savefilesDir);
        }

        // Make sure data value is a string
        if (typeof savefileValue !== "string") savefileValue = "{}";

        // Save the file in JSON format
        fs.writeFile(path.join(process.cwd(), "savefiles", `${savefileName}.json`), savefileValue, (err) => {
            if (err) return console.log(err);
            console.log("File was created succesfully!");
        });
    });

    // Create a new window from savefile
    ipcMain.handle("create-window-from-savefile", (event, message, data) => {
        if (message === "timer-and-splits") {
            createdWindow = createTimerAndSplitsWindow(data);
        }
    })

}

// Execute after app's ready event. This initializes the app.
const initApp = () => {
    // Handle IPC messages from the renderer process
    handleIpcMessages();

    // Create main window
    const mainWindow = createMainWindow();
    appWindowData.appWindows.mainWindow = mainWindow;

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

    // Unregister global keyboard shortcuts when app is closed
    app.on("will-quit", () => {
        unregisterGlobalShortcuts();
    })
    

    // Do checks if necessary
    console.log("Node version:", process.versions["node"]);
    console.log("Chrome version:", process.versions["chrome"]);
    console.log("Electron version:", process.versions["electron"]);
}

// Wait for app module's ready event to initialize the app
app.whenReady().then(initApp);