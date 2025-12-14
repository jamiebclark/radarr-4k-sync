const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    const filePath = path.join(distDir, file);
    try {
      fs.rmSync(filePath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting ${filePath}:`, error.message);
    }
  }
  console.log('Cleaned dist directory');
} else {
  console.log('Dist directory does not exist, skipping clean');
}

