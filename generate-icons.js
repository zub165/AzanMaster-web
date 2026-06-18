/**
 * Icon Generator Script for Adhan Master
 * 
 * This script generates all the necessary icons for different platforms
 * from a single source SVG file.
 * 
 * Requirements:
 * - Node.js
 * - sharp package (npm install sharp)
 * 
 * Usage:
 * node generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const SOURCE_ICON = './assets/icons/favicon.svg';
const OUTPUT_DIR = './assets/icons';
const BACKGROUND_COLOR = { r: 67, g: 160, b: 71, alpha: 1 }; // #43a047

// Icon sizes to generate
const ICON_SIZES = [
    // Web app icons
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
    
    // iOS specific
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 120, name: 'apple-touch-icon-120x120.png' },
    { size: 167, name: 'apple-touch-icon-167x167.png' },
    
    // Android specific
    { size: 48, name: 'android-icon-48x48.png' },
    { size: 72, name: 'android-icon-72x72.png' },
    { size: 96, name: 'android-icon-96x96.png' },
    { size: 144, name: 'android-icon-144x144.png' },
    { size: 192, name: 'android-icon-192x192.png' },
    
    // Favicon sizes
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 64, name: 'favicon-64x64.png' }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Generate icons
async function generateIcons() {
    console.log(`Generating icons from ${SOURCE_ICON}...`);
    
    try {
        // Read the SVG file
        const svgBuffer = fs.readFileSync(SOURCE_ICON);
        
        // Process each icon size
        for (const icon of ICON_SIZES) {
            const outputPath = path.join(OUTPUT_DIR, icon.name);
            
            await sharp(svgBuffer)
                .resize(icon.size, icon.size)
                .flatten({ background: BACKGROUND_COLOR })
                .png()
                .toFile(outputPath);
                
            console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
        }
        
        console.log('All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

// Generate favicon.ico (multi-size icon)
async function generateFavicon() {
    console.log('Generating favicon.ico...');
    
    try {
        const svgBuffer = fs.readFileSync(SOURCE_ICON);
        const outputPath = path.join(OUTPUT_DIR, 'favicon.ico');
        
        // Create temporary PNGs for each favicon size
        const tempFiles = [];
        const sizes = [16, 32, 48];
        
        for (const size of sizes) {
            const tempFile = path.join(OUTPUT_DIR, `temp-${size}.png`);
            await sharp(svgBuffer)
                .resize(size, size)
                .flatten({ background: BACKGROUND_COLOR })
                .png()
                .toFile(tempFile);
                
            tempFiles.push(tempFile);
        }
        
        // Use ImageMagick to combine the PNGs into an ICO file
        // Note: This requires ImageMagick to be installed
        const { execSync } = require('child_process');
        const command = `convert ${tempFiles.join(' ')} ${outputPath}`;
        
        try {
            execSync(command);
            console.log('Generated: favicon.ico');
        } catch (error) {
            console.error('Error creating favicon.ico. Make sure ImageMagick is installed.');
            console.error('You can manually create favicon.ico using an online converter with the generated PNG files.');
        }
        
        // Clean up temporary files
        for (const file of tempFiles) {
            fs.unlinkSync(file);
        }
    } catch (error) {
        console.error('Error generating favicon.ico:', error);
    }
}

// Main function
async function main() {
    await generateIcons();
    
    try {
        await generateFavicon();
    } catch (error) {
        console.error('Skipping favicon.ico generation:', error.message);
    }
    
    console.log('\nIcon generation complete!');
    console.log('\nNext steps:');
    console.log('1. Add the icons to your manifest.json file');
    console.log('2. Add appropriate <link> tags to your HTML');
    console.log('3. Test your app on different devices');
}

// Run the script
main().catch(console.error); 