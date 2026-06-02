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

import { globalShortcut } from 'electron';

export class ShortcutManager {
  private registered: Map<string, () => void> = new Map();

  register(combination: string, callback: () => void): boolean {
    // Unregister first if already registered
    if (this.registered.has(combination)) {
      this.unregister(combination);
    }

    const registered = globalShortcut.register(combination, callback);
    if (registered) {
      this.registered.set(combination, callback);
    }
    return registered;
  }

  unregister(combination: string): void {
    globalShortcut.unregister(combination);
    this.registered.delete(combination);
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registered.clear();
  }

  isRegistered(combination: string): boolean {
    return this.registered.has(combination);
  }
}
