const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Product = require('./models/productModel');

// Load config
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

// Configure Cloudinary
// YOU NEED TO ADD THESE TO YOUR server/config/config.env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB connected for Cloudinary upload');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const uploadModels = async () => {
    await connectDB();

    const modelDir = path.join(__dirname, 'Model');
    const products = await Product.find();

    console.log(`Found ${products.length} products. Checking for local models...`);

    for (let product of products) {
        console.log(`\n--- Processing: ${product.name} ---`);

        // 1. Handle 3D Model
        if (product.modelSrc && !product.modelSrc.includes('cloudinary.com')) {
            let localModelPath = path.join(modelDir, product.modelSrc);
            
            if (fs.existsSync(localModelPath) && fs.lstatSync(localModelPath).isDirectory()) {
                const files = fs.readdirSync(localModelPath);
                const glb = files.find(f => f.toLowerCase().endsWith('.glb'));
                if (glb) localModelPath = path.join(localModelPath, glb);
            }

            if (!localModelPath.toLowerCase().endsWith('.glb') && fs.existsSync(localModelPath + '.glb')) {
                localModelPath += '.glb';
            }

            if (fs.existsSync(localModelPath) && fs.lstatSync(localModelPath).isFile()) {
                try {
                    console.log(`[MODEL] Uploading: ${localModelPath}`);
                    const result = await cloudinary.uploader.upload(localModelPath, {
                        resource_type: 'raw',
                        folder: 'arova/models',
                        public_id: `${product.name.replace(/\s+/g, '_')}_model`
                    });
                    product.modelSrc = result.secure_url;
                    console.log(`[MODEL] OK: ${result.secure_url}`);
                } catch (err) {
                    console.error(`[MODEL] ERR:`, err.message);
                }
            }
        }

        // 2. Handle Images
        if (product.images && product.images.length > 0) {
            for (let i = 0; i < product.images.length; i++) {
                let img = product.images[i];
                
                // Skip if already cloudinary
                if (img.url.includes('cloudinary.com')) continue;

                // Extract local path from URL or public_id
                // URL example: http://192.168.18.18:4000/api/v1/model/Zoney/Zoney1.png
                // We need to find the file in the Model directory
                let relativePath = img.url.split('/api/v1/model/')[1];
                if (!relativePath) continue;

                let localImgPath = path.join(modelDir, decodeURIComponent(relativePath));

                if (fs.existsSync(localImgPath) && fs.lstatSync(localImgPath).isFile()) {
                    try {
                        console.log(`[IMAGE] Uploading: ${localImgPath}`);
                        const result = await cloudinary.uploader.upload(localImgPath, {
                            resource_type: 'image',
                            folder: 'arova/products',
                        });
                        
                        product.images[i].url = result.secure_url;
                        product.images[i].public_id = result.public_id;
                        console.log(`[IMAGE] OK: ${result.secure_url}`);
                    } catch (err) {
                        console.error(`[IMAGE] ERR:`, err.message);
                    }
                }
            }
        }

        await product.save({ validateBeforeSave: false });
    }

    console.log('\n--- UPLOAD COMPLETE ---');
    process.exit(0);
};

uploadModels();
