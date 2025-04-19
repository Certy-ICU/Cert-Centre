const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateIcons() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.svg');
  
  // Icon sizes needed for PWA
  const sizes = [192, 512];
  
  for (const size of sizes) {
    console.log(`Generating ${size}x${size} icon...`);
    
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
      
    console.log(`Generated: icon-${size}x${size}.png`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
}); 