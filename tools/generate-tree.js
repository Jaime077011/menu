import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories and files to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'coverage',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env*',
  'dist',
  'build'
];

// Check if path should be ignored
function shouldIgnore(name) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(name);
    }
    return name === pattern || name.startsWith(pattern);
  });
}

// Generate tree structure
function generateTree(dirPath, prefix = '', maxDepth = 4, currentDepth = 0) {
  if (currentDepth >= maxDepth) return '';
  
  let result = '';
  
  try {
    const items = fs.readdirSync(dirPath)
      .filter(item => !shouldIgnore(item))
      .sort((a, b) => {
        const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
        
        // Directories first, then files
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });

    items.forEach((item, index) => {
      const itemPath = path.join(dirPath, item);
      const isLast = index === items.length - 1;
      const isDirectory = fs.statSync(itemPath).isDirectory();
      
      const connector = isLast ? '└── ' : '├── ';
      const icon = isDirectory ? '📁 ' : '';
      
      result += `${prefix}${connector}${icon}${item}\n`;
      
      if (isDirectory && currentDepth < maxDepth - 1) {
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        result += generateTree(itemPath, nextPrefix, maxDepth, currentDepth + 1);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return result;
}

// Main execution
function main() {
  const rootDir = path.resolve(__dirname, '..');
  const projectName = path.basename(rootDir);
  
  console.log('🌳 Generating repository tree...');
  
  const treeContent = generateTree(rootDir);
  
  const markdown = `# 📁 Repository Structure

> Auto-generated with \`npm run docs:tree\` on ${new Date().toISOString().split('T')[0]}

\`\`\`
${projectName}/
${treeContent}\`\`\`

## 📊 Quick Stats
- **Total directories**: ${(treeContent.match(/📁/g) || []).length}
- **Configuration files**: ${(treeContent.match(/\.(json|js|ts|config|rc)/g) || []).length}
- **Documentation files**: ${(treeContent.match(/\.(md|txt)/g) || []).length}

## 🎯 Key Directories

| Directory | Purpose |
|-----------|---------|
| \`src/\` | Main application source code |
| \`docs/\` | Project documentation |
| \`config/\` | Configuration files |
| \`tools/\` | Development tools and scripts |
| \`public/\` | Static assets served by the web server |
| \`prisma/\` | Database schema and migrations |

---

*This file is automatically updated. Do not edit manually.*
`;

  fs.writeFileSync('REPO_TREE.md', markdown);
  console.log('✅ Repository tree generated successfully!');
  console.log('📄 Updated: REPO_TREE.md');
}

// Run if this is the main module
main();

export { generateTree, shouldIgnore }; 