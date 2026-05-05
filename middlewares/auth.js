const ErrorHander = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncErrors');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
	let token = req.cookies.token;

	if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(
			new ErrorHander(
				'Please Login to access this resource',
				401
			)
		);
	}

	const decodedData = jwt.verify(token, process.env.JWT_SECRET);

	req.user = await User.findById(decodedData.id);

	next();
});

exports.authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return next(
				new ErrorHander(
					`Role: ${req.user ? req.user.role : 'Guest'} is not allowed to access this resouce `,
					403
				)
			);
		}

		next();
	};
};
