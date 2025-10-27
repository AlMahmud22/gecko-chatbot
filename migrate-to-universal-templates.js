/**
 * Migration Script: Universal Template System
 * 
 * This script safely migrates the codebase to use the new Universal Template System.
 * It creates backups and allows for easy rollback if needed.
 * 
 * Run with: node migrate-to-universal-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups', `migration-${Date.now()}`);

const FILES_TO_BACKUP = [
  'src/backend/inference/engines/llama-cpp-engine.js',
  'src/backend/inference/response-validator.js',
  'src/backend/inference/chat-templates/llama-chat-template-registry.js',
];

const FILES_TO_REPLACE = {
  'src/backend/inference/engines/llama-cpp-engine.js': 'src/backend/inference/engines/llama-cpp-engine-v2.js',
  'src/backend/inference/response-validator.js': 'src/backend/inference/response-validator-v2.js',
};

/**
 * Create backup directory and copy files
 */
function createBackups() {
  console.log('Creating backups...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  for (const file of FILES_TO_BACKUP) {
    const srcPath = path.join(__dirname, '..', '..', file);
    const destPath = path.join(BACKUP_DIR, path.basename(file));
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Backed up: ${file}`);
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  }
  
  console.log(`\nBackups created in: ${BACKUP_DIR}\n`);
}

/**
 * Replace old files with new versions
 */
function migrateFiles() {
  console.log('Migrating to new Universal Template System...\n');
  
  for (const [oldFile, newFile] of Object.entries(FILES_TO_REPLACE)) {
    const oldPath = path.join(__dirname, '..', '..', oldFile);
    const newPath = path.join(__dirname, '..', '..', newFile);
    
    if (fs.existsSync(newPath)) {
      fs.copyFileSync(newPath, oldPath);
      console.log(`✓ Migrated: ${oldFile}`);
    } else {
      console.error(`✗ New file not found: ${newFile}`);
    }
  }
  
  console.log('\nMigration complete!\n');
}

/**
 * Generate rollback script
 */
function generateRollbackScript() {
  const rollbackPath = path.join(BACKUP_DIR, 'rollback.js');
  
  const rollbackScript = `
/**
 * Rollback Script
 * Restores the backed up files to undo the migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = __dirname;
const PROJECT_ROOT = path.join(__dirname, '..', '..');

const FILES_TO_RESTORE = ${JSON.stringify(FILES_TO_BACKUP, null, 2)};

console.log('Rolling back to previous version...\\n');

for (const file of FILES_TO_RESTORE) {
  const backupPath = path.join(BACKUP_DIR, path.basename(file));
  const destPath = path.join(PROJECT_ROOT, file);
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, destPath);
    console.log(\`✓ Restored: \${file}\`);
  } else {
    console.error(\`✗ Backup not found: \${file}\`);
  }
}

console.log('\\nRollback complete!\\n');
`;

  fs.writeFileSync(rollbackPath, rollbackScript);
  console.log(`Rollback script created: ${rollbackPath}\n`);
}

/**
 * Main migration process
 */
function migrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Universal Template System Migration                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Create backups
    createBackups();
    
    // Step 2: Migrate files
    migrateFiles();
    
    // Step 3: Generate rollback script
    generateRollbackScript();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Migration Summary                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✓ Backups created successfully');
    console.log('✓ Files migrated to Universal Template System');
    console.log('✓ Rollback script generated');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Test GGUF model inference');
    console.log('3. Verify no template artifacts in responses');
    console.log('');
    console.log('If issues occur, run the rollback script:');
    console.log(`   node ${path.join(BACKUP_DIR, 'rollback.js')}`);
    console.log('');
    
  } catch (err) {
    console.error('Migration failed:', err);
    console.error('\nPlease restore backups manually from:', BACKUP_DIR);
    process.exit(1);
  }
}

// Run migration
migrate();
