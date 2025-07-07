#!/usr/bin/env node

/**
 * Repository Reorganization Script
 * 
 * This script helps reorganize the repository structure according to
 * the suggestions in REPO_TREE.md
 * 
 * Usage: node tools/reorganize-repo.js [--dry-run] [--phase=1|2|3]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  phase: process.argv.find(arg => arg.startsWith('--phase='))?.split('=')[1] || '1',
  rootDir: path.resolve(__dirname, '..'),
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const exists = (filePath) => fs.existsSync(path.join(config.rootDir, filePath));

const createDir = (dirPath) => {
  const fullPath = path.join(config.rootDir, dirPath);
  if (!config.dryRun) {
    fs.mkdirSync(fullPath, { recursive: true });
    log(`✅ Created directory: ${dirPath}`, 'success');
  } else {
    log(`[DRY-RUN] Would create directory: ${dirPath}`, 'info');
  }
};

const moveFile = (from, to) => {
  const fromPath = path.join(config.rootDir, from);
  const toPath = path.join(config.rootDir, to);
  
  if (!exists(from)) {
    log(`⚠️  File not found: ${from}`, 'warning');
    return;
  }
  
  if (!config.dryRun) {
    // Create destination directory if it doesn't exist
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.renameSync(fromPath, toPath);
    log(`✅ Moved: ${from} → ${to}`, 'success');
  } else {
    log(`[DRY-RUN] Would move: ${from} → ${to}`, 'info');
  }
};

const copyFile = (from, to) => {
  const fromPath = path.join(config.rootDir, from);
  const toPath = path.join(config.rootDir, to);
  
  if (!exists(from)) {
    log(`⚠️  File not found: ${from}`, 'warning');
    return;
  }
  
  if (!config.dryRun) {
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.copyFileSync(fromPath, toPath);
    log(`✅ Copied: ${from} → ${to}`, 'success');
  } else {
    log(`[DRY-RUN] Would copy: ${from} → ${to}`, 'info');
  }
};

// Phase implementations
const phase1Improvements = () => {
  log('\n🚀 Phase 1: Quick Wins', 'info');
  log('================================', 'info');
  
  // 1. Move documentation files
  log('\n📚 Reorganizing documentation...', 'info');
  createDir('docs');
  createDir('docs/development');
  createDir('docs/development/plans');
  createDir('docs/phases');
  createDir('docs/deployment');
  
  const docMoves = [
    ['PROJECT_DOCUMENTATION.md', 'docs/development/PROJECT_DOCUMENTATION.md'],
    ['PROJECT_PROGRESS.md', 'docs/development/PROJECT_PROGRESS.md'],
    ['rules.md', 'docs/development/rules.md'],
    ['plan.md', 'docs/development/plans/plan.md'],
    ['plan-02.md', 'docs/development/plans/plan-02.md'],
    ['UI-UX-PLAN.md', 'docs/development/plans/UI-UX-PLAN.md'],
    ['PHASE_AI_WAITER_ENHANCEMENT.md', 'docs/phases/PHASE_AI_WAITER_ENHANCEMENT.md'],
    ['PHASE_7_DOCUMENTATION.md', 'docs/phases/PHASE_7_DOCUMENTATION.md'],
    ['DEPLOYMENT.md', 'docs/deployment/DEPLOYMENT.md'],
  ];
  
  docMoves.forEach(([from, to]) => moveFile(from, to));
  
  // 2. Reorganize test files
  log('\n🧪 Reorganizing test files...', 'info');
  createDir('src/__tests__/pages/phase-tests');
  createDir('src/__tests__/pages/components');
  createDir('src/__tests__/pages/modern');
  createDir('src/__tests__/unit/components');
  createDir('src/__tests__/unit/hooks');
  createDir('src/__tests__/unit/utils');
  
  const testMoves = [
    ['src/pages/test-phase3.tsx', 'src/__tests__/pages/phase-tests/test-phase3.tsx'],
    ['src/pages/test-phase4.tsx', 'src/__tests__/pages/phase-tests/test-phase4.tsx'],
    ['src/pages/test-phase5.tsx', 'src/__tests__/pages/phase-tests/test-phase5.tsx'],
    ['src/pages/test-phase6.tsx', 'src/__tests__/pages/phase-tests/test-phase6.tsx'],
    ['src/pages/test-phase7.tsx', 'src/__tests__/pages/phase-tests/test-phase7.tsx'],
    ['src/pages/test-chat.tsx', 'src/__tests__/pages/components/test-chat.tsx'],
    ['src/pages/test-rive-character.tsx', 'src/__tests__/pages/components/test-rive-character.tsx'],
    ['src/pages/test-modal.tsx', 'src/__tests__/pages/components/test-modal.tsx'],
    ['src/pages/test-menu-cards.tsx', 'src/__tests__/pages/components/test-menu-cards.tsx'],
    ['src/pages/test-modern-chat.tsx', 'src/__tests__/pages/modern/test-modern-chat.tsx'],
  ];
  
  testMoves.forEach(([from, to]) => moveFile(from, to));
  
  // 3. Create .github directory
  log('\n🐙 Setting up GitHub templates...', 'info');
  createDir('.github');
  createDir('.github/workflows');
  createDir('.github/ISSUE_TEMPLATE');
  
  // Create basic workflow files
  const ciWorkflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run typecheck
    
    - name: Run tests
      run: npm run test
    
    - name: Build application
      run: npm run build
`;
  
  if (!config.dryRun) {
    fs.writeFileSync(path.join(config.rootDir, '.github/workflows/ci.yml'), ciWorkflow);
    log('✅ Created .github/workflows/ci.yml', 'success');
  } else {
    log('[DRY-RUN] Would create .github/workflows/ci.yml', 'info');
  }
  
  log('\n✅ Phase 1 completed successfully!', 'success');
};

const phase2Improvements = () => {
  log('\n🚀 Phase 2: Structure Improvements', 'info');
  log('=====================================', 'info');
  
  // 1. Reorganize chat module
  log('\n💬 Reorganizing chat module...', 'info');
  createDir('src/modules/standalone-chat/pages');
  createDir('src/modules/standalone-chat/assets');
  createDir('src/modules/standalone-chat/styles');
  createDir('src/modules/standalone-chat/scripts');
  
  const chatMoves = [
    ['chat/index.html', 'src/modules/standalone-chat/pages/index.html'],
    ['chat/demo.html', 'src/modules/standalone-chat/pages/demo.html'],
    ['chat/interactive_avatar.riv', 'src/modules/standalone-chat/assets/interactive_avatar.riv'],
    ['chat/styles.css', 'src/modules/standalone-chat/styles/styles.css'],
    ['chat/script.js', 'src/modules/standalone-chat/scripts/script.js'],
    ['chat/PLAN.md', 'src/modules/standalone-chat/README.md'],
  ];
  
  chatMoves.forEach(([from, to]) => moveFile(from, to));
  
  // 2. Better config organization
  log('\n⚙️  Reorganizing configuration...', 'info');
  createDir('config/env');
  createDir('config/database');
  createDir('config/deployment');
  
  const configMoves = [
    ['env.example', 'config/env/.env.example'],
    ['start-database.sh', 'config/database/start-database.sh'],
    ['vercel.json', 'config/deployment/vercel.json'],
  ];
  
  configMoves.forEach(([from, to]) => moveFile(from, to));
  
  // 3. Enhanced public assets
  log('\n🎨 Reorganizing public assets...', 'info');
  createDir('public/assets/images');
  createDir('public/assets/icons');
  createDir('public/assets/animations/rive');
  createDir('public/static');
  
  moveFile('public/favicon.ico', 'public/static/favicon.ico');
  if (exists('public/rive')) {
    moveFile('public/rive', 'public/assets/animations/rive');
  }
  
  log('\n✅ Phase 2 completed successfully!', 'success');
};

const phase3Improvements = () => {
  log('\n🚀 Phase 3: Advanced Improvements', 'info');
  log('===================================', 'info');
  
  // 1. Feature-based structure
  log('\n🏗️  Creating feature-based structure...', 'info');
  createDir('src/features/authentication');
  createDir('src/features/menu-management');
  createDir('src/features/order-processing');
  createDir('src/features/chat-system');
  createDir('src/features/admin-dashboard');
  
  // 2. Shared components
  log('\n🔄 Reorganizing shared components...', 'info');
  createDir('src/shared/ui');
  createDir('src/shared/hooks');
  createDir('src/shared/utils');
  createDir('src/shared/types');
  
  // 3. Core configuration
  createDir('src/core/config');
  createDir('src/core/providers');
  
  // 4. Type definitions
  createDir('src/types');
  createDir('src/constants');
  
  // 5. Tools directory
  createDir('tools/scripts');
  createDir('tools/generators');
  createDir('tools/docs');
  
  log('\n✅ Phase 3 completed successfully!', 'success');
};

// Main execution
const main = () => {
  log('🌟 Repository Reorganization Tool', 'info');
  log('=================================\n', 'info');
  
  if (config.dryRun) {
    log('🔍 Running in DRY-RUN mode - no changes will be made', 'warning');
  }
  
  log(`📋 Running Phase ${config.phase} improvements`, 'info');
  log(`📁 Working directory: ${config.rootDir}`, 'info');
  
  try {
    switch (config.phase) {
      case '1':
        phase1Improvements();
        break;
      case '2':
        phase1Improvements();
        phase2Improvements();
        break;
      case '3':
        phase1Improvements();
        phase2Improvements();
        phase3Improvements();
        break;
      default:
        log('❌ Invalid phase. Use --phase=1, --phase=2, or --phase=3', 'error');
        process.exit(1);
    }
    
    log('\n🎉 Repository reorganization completed!', 'success');
    log('\n📝 Next steps:', 'info');
    log('1. Review the changes and test your application', 'info');
    log('2. Update import paths in your code', 'info');
    log('3. Update your tsconfig.json paths if needed', 'info');
    log('4. Update your documentation', 'info');
    
  } catch (error) {
    log(`❌ Error during reorganization: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  phase1Improvements,
  phase2Improvements,
  phase3Improvements,
}; 