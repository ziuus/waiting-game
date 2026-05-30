#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

const version = '0.4.0';
const baseUrl = `https://github.com/ziuus/waiting-game/releases/download/v${version}`;

function getDownloadUrl() {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'win32') {
        return `${baseUrl}/waiting-game_${version}_x64-setup.exe`;
    } else if (platform === 'darwin') {
        return `${baseUrl}/waiting-game_${version}_aarch64.dmg`;
    } else if (platform === 'linux') {
        return `${baseUrl}/waiting-game_${version}_amd64.AppImage`;
    }
    return null;
}

const url = getDownloadUrl();
if (!url) {
    console.error('Unsupported platform');
    process.exit(1);
}

console.log(`Waiting Game v${version}`);
console.log(`Download the installer for your platform here: ${url}`);
console.log('\nOr visit the release page: https://github.com/ziuus/waiting-game/releases');
