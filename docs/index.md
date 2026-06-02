# PiNGiN Documentation

## Overview

PiNGiN is a cross-platform local-first pi-agent companion that appears next to your cursor on shortcut, captures context automatically, provides inline chat for simple tasks, and manages background pi sessions for heavier tasks.

## Quick Links

- [Installation](installation.md) — Get up and running
- [Configuration](configuration.md) — Customize PiNGiN to your needs
- [How-To Guide](how-to.md) — Step-by-step usage instructions
- [Architecture](architecture.md) — How it works under the hood

## Features at a Glance

- ⚡ **Cursor-following** — appears at your cursor on global shortcut
- 📋 **Context capture** — window title, selected text, browser URL, screenshot
- 💬 **Inline chat** — streaming responses with thinking/tool-call sections
- 🔄 **Session management** — multiple sessions with history and resume
- 🎨 **Themeable** — slate-red, slate-blue, slate-green, slate-purple
- 📊 **Context pill** — model, thinking level, context usage with color-coded progress bar

## Architecture

PiNGiN uses **Electron** for the desktop shell and communicates with pi-agent via **RPC mode** (`pi --mode rpc`). This gives us full Node.js compatibility, process isolation, and clean event streaming.
