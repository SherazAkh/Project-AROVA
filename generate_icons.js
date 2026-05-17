/**
 * AROVA - APK Icon Generator
 * Resizes your source icon to all required Android mipmap sizes
 * Run from the project root: node generate_icons.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install sharp if not present
try {
    require.resolve('sharp');
    console.log('sharp found.');
} catch (e) {
    console.log('Installing sharp...');
    execSync('npm install sharp --save-dev --legacy-peer-deps', { stdio: 'inherit' });
}

const sharp = require('sharp');

// Source icon — using adaptive-icon.png (your branded icon)
const SOURCE_ICON = path.join(__dirname, 'assets', 'FAVICON (2).png');

// Android mipmap sizes
const SIZES = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
};

const RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error('Source icon not found at:', SOURCE_ICON);
        process.exit(1);
    }

    for (const [folder, size] of Object.entries(SIZES)) {
        const outDir = path.join(RES_DIR, folder);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        const outSquare = path.join(outDir, 'ic_launcher.png');
        const outRound  = path.join(outDir, 'ic_launcher_round.png');

        await sharp(SOURCE_ICON)
            .resize(size, size, { fit: 'contain', background: { r: 8, g: 8, b: 8, alpha: 1 } })
            .png()
            .toFile(outSquare);

        await sharp(SOURCE_ICON)
            .resize(size, size, { fit: 'cover', background: { r: 8, g: 8, b: 8, alpha: 1 } })
            .png()
            .toFile(outRound);

        console.log(`✓ ${folder} → ${size}x${size}px`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('→ Rebuild the APK with: npx react-native run-android');
}

generateIcons().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
