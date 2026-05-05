const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Error middleware
const errorMiddleware = require('./middlewares/error');

dotenv.config({ path: path.join(__dirname, 'config/config.env') });

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const fs = require('fs');

// ─── 3D Model Serving ────────────────────────────────────────────────────────
// CRITICAL FIX: req.url contains percent-encoded paths e.g. /decor%20models/file.glb
// path.join() treats this literally and looks for folder 'decor%20models' which doesn't exist.
// We must decode first, then join with the filesystem path.
app.use('/api/v1/model', (req, res) => {
    try {
        // Decode percent-encoding: 'decor%20models' → 'decor models'
        const decodedUrl = decodeURIComponent(req.url);

        // Security: prevent path traversal
        const safePath = decodedUrl.replace(/\.\./g, '').replace(/\\/g, '/');

        const requestedPath = path.join(__dirname, 'Model', safePath);

        // Case 1: Directory (old-style product folders) — find .glb inside
        if (fs.existsSync(requestedPath) && fs.lstatSync(requestedPath).isDirectory()) {
            const files = fs.readdirSync(requestedPath);
            const glbFile = files.find(f => f.toLowerCase().endsWith('.glb'));
            if (glbFile) {
                // OPTIMIZATION: Cache models but allow revalidation
                res.setHeader('Cache-Control', 'public, max-age=3600');
                return res.sendFile(path.join(requestedPath, glbFile));
            }
            return res.status(404).json({ error: 'No .glb file found in directory' });
        }

        // Case 2: Direct file path
        if (fs.existsSync(requestedPath) && fs.lstatSync(requestedPath).isFile()) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.sendFile(requestedPath);
        }

        // Not found
        console.warn(`Model not found: ${requestedPath}`);
        res.status(404).json({ error: 'Model not found', path: safePath });
    } catch (err) {
        console.error('Model serve error:', err);
        res.status(500).json({ error: 'Server error serving model' });
    }
});

// Routes
const adminRoutes = require('./routes/adminRoutes');
const product = require('./routes/productRoute');
const user = require('./routes/userRoutes');
const order = require('./routes/orderRoute');
const paymentRoute = require('./routes/paymentRoute');

app.use('/system-control', adminRoutes);
app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', order);
app.use('/api/v1', paymentRoute);

app.use(errorMiddleware);
module.exports = app;
