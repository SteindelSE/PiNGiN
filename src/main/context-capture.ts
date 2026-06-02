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

import { desktopCapturer, clipboard, nativeImage } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CapturedContext, PinginSettings } from '@shared/types';

const execAsync = promisify(exec);

export class ContextCapture {
  private markedRegion: { x: number; y: number; width: number; height: number } | null = null;

  constructor(private settings: PinginSettings) {}

  async capture(settings: PinginSettings): Promise<CapturedContext> {
    const results: any = {};

    // Capture window title
    if (settings.captureWindow) {
      results.windowTitle = await this.getWindowTitle();
    } else {
      results.windowTitle = '';
    }

    // Capture selected text
    if (settings.captureSelectedText) {
      results.selectedText = await this.getSelectedText();
    } else {
      results.selectedText = '';
    }

    // Capture browser URL
    if (settings.captureBrowserUrl) {
      results.browserUrl = await this.getBrowserUrl();
    } else {
      results.browserUrl = '';
    }

    // Capture screenshot
    if (settings.captureScreenshot) {
      results.screenshot = await this.takeScreenshot();
    }

    // Capture marked region
    if (this.markedRegion) {
      results.markedRegion = await this.captureRegion(this.markedRegion);
      this.markedRegion = null;
    }

    results.workingDirectory = process.cwd();
    results.timestamp = Date.now();

    return results as CapturedContext;
  }

  setMarkedRegion(region: { x: number; y: number; width: number; height: number }): void {
    this.markedRegion = region;
  }

  async captureMarkedRegion(): Promise<string | null> {
    if (!this.markedRegion) return null;
    return this.captureRegion(this.markedRegion);
  }

  private async getWindowTitle(): Promise<string> {
    try {
      switch (process.platform) {
        case 'darwin':
          return this.getWindowTitleMac();
        case 'win32':
          return this.getWindowTitleWin();
        default:
          return this.getWindowTitleLinux();
      }
    } catch {
      return 'Unknown';
    }
  }

  private async getWindowTitleMac(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `osascript -e 'tell application "System Events" to get name of first window of first application whose frontmost is true'`
      );
      return stdout.trim();
    } catch {
      return 'Unknown';
    }
  }

  private async getWindowTitleWin(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::FromHandle([System.Windows.Forms.Form]::ActiveForm.Handle).WorkingArea.ToString()"`
      );
      // Fallback: just return the foreground process name
      const { stdout: proc } = await execAsync(
        `powershell -Command "Get-Process -Id (Get-CimInstance Win32_Process -Filter 'Handle = (Select-Object -First 1 (Get-CimInstance Win32_Process | Where-Object { $_.SessionId -eq (Get-CimInstance Win32_Process -Filter \"Name \\'explorer.exe\\'\").SessionId }).MainWindowHandle}).ProcessName"`
      );
      return proc.trim();
    } catch {
      return 'Unknown';
    }
  }

  private async getWindowTitleLinux(): Promise<string> {
    try {
      // Try xdotool first
      const { stdout } = await execAsync(
        'xdotool getactivewindow getwindowname 2>/dev/null || echo "Unknown"'
      );
      return stdout.trim() || 'Unknown';
    } catch {
      // Fallback: try wmctrl
      try {
        const { stdout } = await execAsync(
          'wmctrl -l | head -1 | awk \'{print $3}\'} 2>/dev/null || echo "Unknown"'
        );
        return stdout.trim() || 'Unknown';
      } catch {
        return 'Unknown';
      }
    }
  }

  private async getSelectedText(): Promise<string> {
    // Save current clipboard
    const saved = clipboard.readText('clipboard');
    const savedFind = clipboard.readText('selection');

    try {
      // Copy selected text to clipboard
      clipboard.writeText('');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate Ctrl+C / Cmd+C
      const { execSync } = require('child_process');

      if (process.platform === 'darwin') {
        execSync('osascript -e \'tell application "System Events" to keystroke "c" using command down\'', { stdio: 'pipe' });
      } else if (process.platform === 'linux') {
        execSync('xdotool key ctrl+c 2>/dev/null', { stdio: 'pipe' });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const selected = clipboard.readText('clipboard');

      // Restore clipboard
      clipboard.writeText(saved);
      if (savedFind) clipboard.writeText(savedFind, 'selection');

      return selected || '';
    } catch {
      // Restore clipboard on error
      clipboard.writeText(saved);
      if (savedFind) clipboard.writeText(savedFind, 'selection');
      return '';
    }
  }

  private async getBrowserUrl(): Promise<string> {
    try {
      if (process.platform === 'darwin') {
        return this.getBrowserUrlMac();
      } else if (process.platform === 'linux') {
        return this.getBrowserUrlLinux();
      } else {
        return this.getBrowserUrlWin();
      }
    } catch {
      return '';
    }
  }

  private async getBrowserUrlMac(): Promise<string> {
    try {
      // Try Chrome first, then Safari, then Firefox
      const { stdout } = await execAsync(
        `osascript -e 'tell application "Google Chrome" to get URL of active tab of first window' 2>/dev/null || \
         osascript -e 'tell application "Safari" to get URL of front document' 2>/dev/null || \
         osascript -e 'tell application "Firefox" to get URL of front tab of front window' 2>/dev/null || \
         echo ""'`
      );
      return stdout.trim();
    } catch {
      return '';
    }
  }

  private async getBrowserUrlLinux(): Promise<string> {
    try {
      // Try to get the active window process and check if it's a browser
      const { stdout: winName } = await execAsync(
        'xdotool getactivewindow getwindowname 2>/dev/null || echo ""'
      );
      const name = winName.trim().toLowerCase();

      if (name.includes('chrome') || name.includes('chromium') || name.includes('firefox') || name.includes('safari')) {
        // Try to get URL from browser-specific methods
        if (name.includes('chrome') || name.includes('chromium')) {
          // Chrome/Chromium: use accessibility or devtools
          try {
            const { stdout } = await execAsync(
              'xdotool getactivewindow getwindowpid 2>/dev/null'
            );
            const pid = stdout.trim();
            if (pid) {
              // Read from /proc for Chrome's current URL
              const { stdout: url } = await execAsync(
                `grep -r "url" /proc/${pid}/fdinfo/ 2>/dev/null | head -1 || echo ""`
              );
              if (url) return url.trim();
            }
          } catch {}
        }
      }

      // Fallback: try xclip to get clipboard URL
      try {
        const { stdout } = await execAsync('xclip -o 2>/dev/null || echo ""');
        const url = stdout.trim();
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
      } catch {}

      return '';
    } catch {
      return '';
    }
  }

  private async getBrowserUrlWin(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $proc = Get-Process -Id (Get-CimInstance Win32_Process -Filter 'MainWindowHandle != 0' | Where-Object { $_.ProcessName -match 'chrome|msedge|firefox|safari' } | Select-Object -First 1).Id; $proc.MainWindowTitle"`
      );
      return stdout.trim();
    } catch {
      return '';
    }
  }

  private async takeScreenshot(): Promise<string | undefined> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1280, height: 720 },
      });

      if (sources.length > 0) {
        const image = sources[0].thumbnail;
        return image.toDataURL();
      }
    } catch {
      // Screenshot capture failed, return undefined
    }
    return undefined;
  }

  private async captureRegion(region: { x: number; y: number; width: number; height: number }): Promise<string> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      if (sources.length > 0) {
        const image = sources[0].thumbnail;
        const display = require('electron').screen.getPrimaryDisplay();
        const scale = image.getSize().width / display.bounds.width;

        // Crop the region
        const cropX = Math.round(region.x * scale);
        const cropY = Math.round(region.y * scale);
        const cropWidth = Math.round(region.width * scale);
        const cropHeight = Math.round(region.height * scale);

        const cropped = image.crop({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
        return cropped.toDataURL();
      }
    } catch {
      // Return empty
    }
    return '';
  }
}
