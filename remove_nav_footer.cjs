const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove imports
      content = content.replace(/import\s+Navbar\s+from\s+['"].*?Navbar['"];?\n?/g, '');
      content = content.replace(/import\s+Footer\s+from\s+['"].*?Footer['"];?\n?/g, '');
      
      // Remove components
      content = content.replace(/<\s*Navbar\s*\/?\s*>\n?/g, '');
      content = content.replace(/<\s*Footer\s*\/?\s*>\n?/g, '');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('./src/pages');
processDir('./src/layouts');
console.log('Removed Nav/Footer from pages and layouts');
