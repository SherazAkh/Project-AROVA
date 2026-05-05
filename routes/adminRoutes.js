const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModels');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // If it's a model, save to Model/ folder
        // If it's an image, save to Model/folder/images
        cb(null, path.join(__dirname, '../Model'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/product/new', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, description, price, originalPrice, stock, category } = req.body;
        
        if (!req.files['image'] || !req.files['model']) {
            return res.status(400).json({
                success: false,
                message: "Please upload both product image and 3D model."
            });
        }

        const imageFile = req.files['image'][0];
        const modelFile = req.files['model'][0];

        // Create folder for the product model
        const folderName = name.replace(/\s+/g, '_');
        const productFolderPath = path.join(__dirname, '../Model', folderName);

        if (!fs.existsSync(productFolderPath)) {
            fs.mkdirSync(productFolderPath, { recursive: true });
        }

        // Move files to the product folder (Using copy + unlink for better Windows compatibility)
        const newImagePath = path.join(productFolderPath, imageFile.originalname);
        const newModelPath = path.join(productFolderPath, modelFile.originalname);

        fs.copyFileSync(imageFile.path, newImagePath);
        fs.unlinkSync(imageFile.path);
        fs.copyFileSync(modelFile.path, newModelPath);
        fs.unlinkSync(modelFile.path);

        // Save to Database
        // Save to Database (Use relative paths to avoid IP mismatch issues)
        const imageUrl = `/api/v1/model/${folderName}/${imageFile.originalname}`;

        // Find a valid user to link the product to (required by Schema)
        const user = await User.findOne();
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No admin user found in database. Please register a user first."
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            modelSrc: folderName,
            stock: stock || 10,
            originalPrice: originalPrice || 0,
            images: [{
                public_id: folderName,
                url: imageUrl
            }],
            user: user._id 
        });

        res.status(201).json({
            success: true,
            product
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Update Product (with optional file updates)
router.put('/product/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
]), async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let updateData = { ...req.body };

        // Handle file updates if provided
        if (req.files && (req.files['image'] || req.files['model'])) {
            const folderName = product.modelSrc;
            const productFolderPath = path.join(__dirname, '../Model', folderName);

            if (!fs.existsSync(productFolderPath)) {
                fs.mkdirSync(productFolderPath, { recursive: true });
            }

            if (req.files['image']) {
                const imageFile = req.files['image'][0];
                const newImagePath = path.join(productFolderPath, imageFile.originalname);
                fs.copyFileSync(imageFile.path, newImagePath);
                fs.unlinkSync(imageFile.path);
                
                updateData.images = [{
                    public_id: folderName,
                    url: `/api/v1/model/${folderName}/${imageFile.originalname}`
                }];
            }

            if (req.files['model']) {
                const modelFile = req.files['model'][0];
                
                // CLEANUP: Remove old .glb files to ensure the new one is picked by the server
                const existingFiles = fs.readdirSync(productFolderPath);
                existingFiles.forEach(file => {
                    if (file.toLowerCase().endsWith('.glb')) {
                        fs.unlinkSync(path.join(productFolderPath, file));
                    }
                });

                const newModelPath = path.join(productFolderPath, modelFile.originalname);
                fs.copyFileSync(modelFile.path, newModelPath);
                fs.unlinkSync(modelFile.path);
            }
        }

        product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Delete Product
router.delete('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product Deleted Successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Get all Orders (Web Admin)
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email');
        res.status(200).json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Order (Web Admin)
router.put('/order/:id', express.json(), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (req.body.status) order.orderStatus = req.body.status;
        if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
        if (req.body.status === 'Delivered') order.deliveredAt = Date.now();

        await order.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Newsletter Subscription
const subscribersFile = path.join(__dirname, '../config/subscribers.json');



router.get('/subscribers', (req, res) => {
    try {
        let subscribers = [];
        if (fs.existsSync(subscribersFile)) {
            subscribers = JSON.parse(fs.readFileSync(subscribersFile));
        }
        res.status(200).json({ success: true, subscribers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

// ─── Analytics Dashboard ────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
    try {
        const orders = await Order.find();
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalOrders = orders.length;
        const totalUsers = await User.countDocuments();
        
        // Group by date
        const salesByDate = {};
        orders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            if (!salesByDate[date]) salesByDate[date] = { revenue: 0, count: 0 };
            salesByDate[date].revenue += order.totalPrice;
            salesByDate[date].count += 1;
        });

        res.status(200).json({ success: true, totalUsers, salesByDate });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Manage Shipping Regions ────────────────────────────────────────────────────────
const shippingFile = path.join(__dirname, '../config/shipping.json');

router.get('/shipping', (req, res) => {
    try {
        if (!fs.existsSync(shippingFile)) {
            fs.writeFileSync(shippingFile, JSON.stringify({ countries: ['Pakistan'], cities: ['Karachi', 'Lahore', 'Islamabad'] }));
        }
        const data = JSON.parse(fs.readFileSync(shippingFile));
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/shipping', express.json(), (req, res) => {
    try {
        fs.writeFileSync(shippingFile, JSON.stringify(req.body));
        res.status(200).json({ success: true, message: "Shipping regions updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Payouts Config ────────────────────────────────────────────────────────
const payoutsFile = path.join(__dirname, '../config/payouts.json');

router.get('/payouts', (req, res) => {
    try {
        if (!fs.existsSync(payoutsFile)) {
            fs.writeFileSync(payoutsFile, JSON.stringify({ easypaisa: '', jazzcash: '', bankAccount: '' }));
        }
        const data = JSON.parse(fs.readFileSync(payoutsFile));
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/payouts', express.json(), (req, res) => {
    try {
        fs.writeFileSync(payoutsFile, JSON.stringify(req.body));
        res.status(200).json({ success: true, message: "Payout settings updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
