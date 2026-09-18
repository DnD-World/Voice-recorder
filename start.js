#!/usr/bin/env node

/**
 * Universal launcher for Φωνή (Foni) - Greek Voice Notes
 * Works on Windows, Mac, and Linux
 * 
 * Usage: node start.js
 * Or make executable: chmod +x start.js && ./start.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Node.js is available (it should be since we're running with node)
console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║                                                        ║');
console.log('║   🎤  Φωνή (Foni) - Greek Voice Notes                 ║');
console.log('║                                                        ║');
console.log('║   Starting server on port 9959...                     ║');
console.log('║                                                        ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

// Check if dist folder exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('⚠️  Build folder not found. Building app...');
    console.log('');
    
    try {
        console.log('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        
        console.log('');
        console.log('Building app...');
        execSync('npm run build', { stdio: 'inherit' });
        
        console.log('');
        console.log('✅ Build complete!');
        console.log('');
    } catch (error) {
        console.error('❌ Error: Build failed!');
        console.error(error.message);
        process.exit(1);
    }
}

// Try to get Tailscale IP
let tailscaleIP = null;
try {
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
        command = 'tailscale ip -4';
    } else {
        command = 'tailscale ip -4';
    }
    
    tailscaleIP = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    console.log(`✅ Tailscale IP: ${tailscaleIP}`);
} catch (error) {
    console.log('⚠️  Tailscale not detected (that\'s okay)');
}

console.log('');
console.log('🌐 Server starting...');
console.log('');
console.log('══════════════════════════════════════════════════════════');
console.log('');
console.log(`  Local access:    http://localhost:9959`);

if (tailscaleIP) {
    console.log(`  Tailscale:       http://${tailscaleIP}:9959`);
    console.log('');
    console.log('  📱 From your phone:');
    console.log(`     Open http://${tailscaleIP}:9959`);
}

console.log('');
console.log('══════════════════════════════════════════════════════════');
console.log('');
console.log('  Press Ctrl+C to stop the server');
console.log('');

// Start the server
require('./server.js');
