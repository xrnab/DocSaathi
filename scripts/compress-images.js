const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function compress() {
  const images = ['banner2.png', 'hero-duo.png'];
  for (const img of images) {
    const inputPath = path.join(__dirname, '..', 'public', img);
    const outputPath = path.join(__dirname, '..', 'public', `compressed_${img}`);
    
    console.log(`Compressing ${img}...`);
    
    const width = img === 'hero-duo.png' ? 600 : 800;
    const colors = img === 'hero-duo.png' ? 64 : 128;
    const quality = img === 'hero-duo.png' ? 50 : 60;

    // Resize slightly and use highly optimized palette reduction for super small size
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .png({ quality, compressionLevel: 9, palette: true, colors })
      .toFile(outputPath);
      
    const originalSize = fs.statSync(inputPath).size / 1024;
    const compressedSize = fs.statSync(outputPath).size / 1024;
    console.log(`${img} original: ${originalSize.toFixed(1)}KB, compressed: ${compressedSize.toFixed(1)}KB`);
    
    // Overwrite the original
    fs.renameSync(outputPath, inputPath);
    console.log(`Updated ${img} successfully!\n`);
  }
}

compress().catch(console.error);
