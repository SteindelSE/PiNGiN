// Copyright (C) 2026 SteindelSE
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import { PinginSettings } from '@shared/types';

export class WindowManager {
  private sessionHistoryWindow: BrowserWindow | null = null;

  createCompanionWindow(settings: PinginSettings): BrowserWindow {
    const win = new BrowserWindow({
      width: settings.windowWidth,
      height: settings.windowHeight,
      minWidth: 320,
      minHeight: 400,
      maxWidth: 800,
      maxHeight: 900,
      frame: false,
      transparent: true,
      hasShadow: true,
      alwaysOnTop: settings.alwaysOnTop,
      skipTaskbar: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload', 'index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    // Load the renderer
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      win.loadFile(path.join(__dirname, '..', 'index.html'));
    }

    // Handle window close — hide instead of destroy
    win.on('close', (e) => {
      e.preventDefault();
      win.hide();
    });

    return win;
  }

  showSessionHistory(settings: PinginSettings): BrowserWindow {
    if (this.sessionHistoryWindow && !this.sessionHistoryWindow.isDestroyed()) {
      this.sessionHistoryWindow.show();
      this.sessionHistoryWindow.focus();
      return this.sessionHistoryWindow;
    }

    this.sessionHistoryWindow = new BrowserWindow({
      width: 360,
      height: 500,
      minWidth: 300,
      minHeight: 300,
      frame: false,
      transparent: true,
      hasShadow: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload', 'index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.sessionHistoryWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/session-history`);
    } else {
      this.sessionHistoryWindow.loadFile(
        path.join(__dirname, '..', 'index.html'),
        { hash: '/session-history' }
      );
    }

    this.sessionHistoryWindow.on('close', (e) => {
      e.preventDefault();
      this.sessionHistoryWindow?.hide();
    });

    this.sessionHistoryWindow.show();
    return this.sessionHistoryWindow;
  }
}
