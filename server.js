const app = require('./app.js');
// import { app  from './app.js'
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./db/database');

process.on('uncaughtException', (err) => {
	console.log(`Error: ${err.message}`);
	console.log(`Shutting down server due to Uncaught Promise Rejection`);
	process.exit(1);
});

// Config
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

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
