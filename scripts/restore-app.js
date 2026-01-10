#!/usr/bin/env node

/**
 * Restore app/ directory after build
 */

const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '../app');
const appBackupDir = path.resolve(__dirname, '../app.backup');

// Restore app directory if backup exists
if (fs.existsSync(appBackupDir)) {
  console.log('Restoring app/ directory from app.backup/...');
  
  // Remove app if it exists
  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true });
  }
  
  // Restore from backup
  fs.renameSync(appBackupDir, appDir);
  console.log('✅ app/ directory restored');
}

