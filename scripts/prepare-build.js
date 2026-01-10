#!/usr/bin/env node

/**
 * Prepare build script - temporarily moves app/ directory to prevent Next.js
 * from detecting it during build, since we're using Pages Router (src/pages/)
 */

const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '../app');
const appBackupDir = path.resolve(__dirname, '../app.backup');

// Check if app directory exists
if (fs.existsSync(appDir)) {
  console.log('⚠️  app/ directory detected. Temporarily moving it to app.backup/ for build...');
  
  // Remove backup if it exists
  if (fs.existsSync(appBackupDir)) {
    fs.rmSync(appBackupDir, { recursive: true, force: true });
  }
  
  // Move app to app.backup
  fs.renameSync(appDir, appBackupDir);
  console.log('✅ app/ directory moved to app.backup/');
} else {
  console.log('✅ No app/ directory found - build can proceed normally');
}

