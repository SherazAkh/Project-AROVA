const mongoose = require('mongoose');

const connectDB = () => {
	console.log(`Attempting to connect to MongoDB...`);
	mongoose
		.connect(process.env.DB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		.then((data) => {
			console.log(`MongoDB connected ${data.connection.host}`);
		})
		.catch((err) => {
			console.log(err);
		});
};

module.exports = connectDB;
