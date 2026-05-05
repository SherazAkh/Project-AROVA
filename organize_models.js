const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/productModel');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'config/config.env') });

const modelDir = path.join(__dirname, 'Model');

async function organizeModels() {
    try {
        await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/Project-Arova');
        console.log('Connected to Database');

        const products = await Product.find();
        console.log(`Found ${products.length} products to check.`);

        const activeFolders = new Set();

        for (const product of products) {
            if (!product.modelSrc) continue;

            const newFolderName = product.name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
            const targetFolderPath = path.join(modelDir, newFolderName);
            activeFolders.add(newFolderName);

            let currentPath = path.join(modelDir, product.modelSrc);

            if (fs.existsSync(currentPath)) {
                const stats = fs.lstatSync(currentPath);
                
                if (stats.isFile()) {
                    if (!fs.existsSync(targetFolderPath)) fs.mkdirSync(targetFolderPath, { recursive: true });
                    const fileName = path.basename(currentPath);
                    fs.copyFileSync(currentPath, path.join(targetFolderPath, fileName));
                    fs.unlinkSync(currentPath); 
                    console.log(`Organized file into folder: ${newFolderName}`);
                } else if (stats.isDirectory()) {
                    if (product.modelSrc !== newFolderName) {
                        if (fs.existsSync(targetFolderPath)) {
                            const files = fs.readdirSync(currentPath);
                            files.forEach(file => {
                                fs.copyFileSync(path.join(currentPath, file), path.join(targetFolderPath, file));
                                fs.unlinkSync(path.join(currentPath, file));
                            });
                            fs.rmdirSync(currentPath);
                        } else {
                            fs.renameSync(currentPath, targetFolderPath);
                        }
                        console.log(`Renamed folder to: ${newFolderName}`);
                    }
                }

                product.modelSrc = newFolderName;
                await product.save({ validateBeforeSave: false });
            }
        }

        // Remove "others" (folders not belonging to any product)
        const allItems = fs.readdirSync(modelDir);
        for (const item of allItems) {
            const itemPath = path.join(modelDir, item);
            if (!activeFolders.has(item) && fs.lstatSync(itemPath).isDirectory()) {
                console.log(`Removing unused folder: ${item}`);
                fs.rmSync(itemPath, { recursive: true, force: true });
            }
        }

        console.log('Organization and Cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

organizeModels();
