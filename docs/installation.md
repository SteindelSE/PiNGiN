# Installation

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **pi-agent** installed and working (`pi --version` should succeed)
- Your pi-agent configured with API keys/models

### Platform-specific dependencies

#### Linux

```bash
# Ubuntu/Debian
sudo apt install xdotool wmctrl

# Fedora/RHEL
sudo dnf install xdotool wmctrl

# Arch
sudo pacman -S xdotool wmctrl
```

#### macOS

No extra dependencies — uses built-in `osascript`.

#### Windows

PowerShell is built-in. No extra dependencies needed.

## Install

```bash
# Clone the repository
git clone <repo-url>
cd pingin

# Install dependencies
npm install

# Build
npm run build
```

## Run

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Package for distribution

```bash
# Current platform only
npm run package

# All platforms (requires proper build environment)
npm run package:all
```

## Docker

```bash
# Build the image
docker build -t pingin .

# Run with X11 forwarding (Linux)
docker run -it --rm \
  -v ~/.pi/agent:/root/.pi/agent \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  pingin

# Run with Wayland
docker run -it --rm \
  -v ~/.pi/agent:/root/.pi/agent \
  -e WAYLAND_DISPLAY=$WAYLAND_DISPLAY \
  -v /run/user/$(id -u)/wayland-0:/run/user/$(id -u)/wayland-0 \
  pingin
```

## Troubleshooting

### "pi command not found"

Make sure pi-agent is installed and on your PATH:

```bash
pi --version
```

If not found, install via npm:

```bash
npm install -g @earendil-works/pi-coding-agent
```

### "xdotool not found" (Linux)

Install xdotool as described above.

### GPU crash on startup

This is a known issue in headless environments. The `--disable-gpu` flag is already set. If you still encounter issues, ensure you have a proper display environment.

### "No models available"

Check that your pi-agent is configured with API keys:

```bash
pi --mode interactive
```

If you can't connect to models there, PiNGiN won't be able to either.
