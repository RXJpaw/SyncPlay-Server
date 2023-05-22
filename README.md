<p align="center" style="text-align: center">
  <a href="https://github.com/RXJpaw/SyncPlay-Server/">
    <img src="https://raw.githubusercontent.com/RXJpaw/SyncPlay-Server/master/assets/logo.png" alt="Logo" width="128" height="128">
</p>

<h3 align="center">SyncPlay Server</h3>
<p align="center">Host a server that synchronizes your friends playback.</p>

<div align="center">

<a href="https://github.com/RXJpaw/SyncPlay-Server/blob/master/LICENSE.md">![Apache License 2.0](https://img.shields.io/github/license/RXJpaw/SyncPlay-Server?0)</a>
<a href="https://github.com/RXJpaw/SyncPlay-Server/issues">![Open Issues](https://img.shields.io/github/issues-raw/RXJpaw/SyncPlay-Server?0)</a>

</div>

## About

Programmed in [TypeScript](https://github.com/microsoft/TypeScript),
this server will handle all requests from [SyncPlay](https://github.com/RXJpaw/SyncPlay)-clients.



## Installation

### Using the provided executables:

1. Go to the [latest version](https://github.com/RXJpaw/SyncPlay-Server/releases/latest).
2. Choose your Operating System and Architecture:
    * `win-x64` for Windows Servers
    * `linux-x64` for normal Linux Servers
    * `linux-arm64` for ARM-based Linux Servers (f.e. Raspberry Pi)
3. Download the file with your chosen OS and ARCH.
4. When using Linux don't forget to grand execute permissions.
5. Run the server for the first time: `./syncplay-server-$OS-$ARCH`
6. Perform the tasks specified in the created config file: `config.toml`
7. Run the server for the second time: `./syncplay-server-$OS-$ARCH`
8. Now people can connect to your SyncPlay server.

### Building the executables yourself:

Requirements: `node.js@>=18.12.1`, `git`.

```bash
git clone https://github.com/RXJpaw/SyncPlay-Server
```
```bash
cd SyncPlay-Server
```
```bash
npm ci
```
```bash
npm run build
```
The built binaries are located in `dist`.