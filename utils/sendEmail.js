const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	console.log(`Starting email send to: ${options.email}`);
	
	const transporter = nodemailer.createTransport({
		host: process.env.SMPT_HOST || 'smtp.gmail.com',
		port: 587, // Better for Render
		secure: false, // Use TLS
		service: process.env.SMPT_SERVICE,
		auth: {
			user: process.env.SMPT_MAIL,
			pass: process.env.SMPT_PASSWORD,
		},
		timeout: 10000, // 10 second timeout
	});

	const mailOptions = {
		from: `"AROVA Shop" <${process.env.SMPT_MAIL}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`Email successfully sent to: ${options.email}`);
	} catch (err) {
		console.error('Nodemailer Error:', err.message);
		throw new Error('Email delivery failed: ' + err.message);
	}
};

module.exports = sendEmail;
