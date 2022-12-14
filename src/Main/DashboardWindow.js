const path = require('path');
const { BrowserWindow, Menu } = require("electron");
const windowStateKeeper = require("electron-window-state");
const settings = require('./settings');

const ICON_PATH = path.join(__dirname, '../icons/logo256x256.png');

module.exports = class DashboardWindow extends BrowserWindow {
	constructor(id, name, options = {}) {
		// Load the previous state with fallback to defaults
		let windowState = windowStateKeeper({
			file: `window-state-dashboard-${id}.json`,
			defaultWidth: 800,
			defaultHeight: 600,
		});

		super({
			x: windowState.x,
			y: windowState.y,
			width: windowState.width,
			height: windowState.height,
            title: `${name} Dashboard`,
			icon: ICON_PATH,
            show: false,
            webPreferences: {
                nodeIntegration: true,
				contextIsolation: false,
            },
			...options
		});

		windowState.manage(this);

		this.setMenu(
			Menu.buildFromTemplate([{ role: 'viewMenu' }])
		);
		this.setMenuBarVisibility(false);

		this.loadFile('public/index.html').then(() => {
			// just for debugging
			// this.show();
			// this.webContents.openDevTools();
		});

		this.isQuiting = false;
		this._whatsappReady = false;
		
		this.on('close', (e) => {
			if(this.isQuiting) {
				return;
			}
            e.preventDefault();
            this.hide();
        });

		this.webContents.on('new-window', (event, url) => {
			event.preventDefault();
			require('electron').shell.openExternal(url);
		});

		this.on('show', () => {
			const isSnap = process.env.SNAP !== undefined && process.env.SNAP !== null;
			const isAppImage = process.env.APPIMAGE !== undefined && process.env.APPIMAGE !== null;
			this.webContents.send('setID', {
				id, isSnap, isAppImage
			});
			this.webContents.send('whatsappReady', this._whatsappReady);
		});

		settings.onDidChange('general.alwaysOnTop', (value) => {
			this.setAlwaysOnTop(value);
		});

		settings.onDidChange('theme.dark', (value) => {
			this.webContents.send('darkTheme', value);
		});
	}

	open(url = '/') {
		this.webContents.send('darkTheme', settings.get('theme.dark.value'));
		this.navigateTo(url);
		this.show();
	}

	navigateTo(url) {
		this.webContents.send('navigate', url);
	}

	whatsappReady(status) {
		this.webContents.send('whatsappReady', status);
		this._whatsappReady = status;
	}

	quitWindow() {
		this.isQuiting = true;
		this.close();
	}
}