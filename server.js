const dotenv = require('dotenv');
const path = require('path');
// Config
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

const app = require('./app.js');
const connectDB = require('./db/database');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

process.on('uncaughtException', (err) => {
	console.log(`Error: ${err.message}`);
	console.log(`Shutting down server due to Uncaught Promise Rejection`);
	process.exit(1);
});

connectDB();
const server = app.listen(process.env.PORT || 4000, () => {
	console.log(`Listening on Port: ${process.env.PORT || 4000}`);
});

// unhandled Promise rejection
process.on('unhandledRejection', (err) => {
	console.log(`Error: ${err.message}`);
	console.log(`Shutting down server due to Unhandled Promise Rejection`);
	server.close(() => {
		process.exit(1);
	});
});
