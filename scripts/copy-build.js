const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const publicPath = path.join(__dirname, '../server/public');

// Remove existing public directory if it exists
if (fs.existsSync(publicPath)) {
    fs.rmSync(publicPath, { recursive: true, force: true });
    console.log('🗑️  Removed existing public directory');
}

// Create public directory
fs.mkdirSync(publicPath, { recursive: true });
console.log('📁 Created public directory');

// Copy all files from dist to server/public
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (fs.existsSync(distPath)) {
    copyRecursiveSync(distPath, publicPath);
    console.log('✅ Copied build files from dist to server/public');
} else {
    console.error('❌ Error: dist folder not found. Run "npm run build" first.');
    process.exit(1);
}

console.log('✨ Build copy completed successfully!');

