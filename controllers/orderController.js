const Order = require('../models/orderModels');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncError = require('../middlewares/catchAsyncErrors');

// Create new order
exports.newOrder = catchAsyncError(async (req, res, next) => {
	const {
		shippingInfo,
		orderItems,
		paymentInfo,
		itemsPrice,
		taxPrice,
		shippingPrice,
		totalPrice,
	} = req.body;

	const order = await Order.create({
		shippingInfo,
		orderItems,
		paymentInfo,
		itemsPrice,
		taxPrice,
		shippingPrice,
		totalPrice,
		paidAt: Date.now(),
		user: req.user._id,
	});

	res.status(201).json({
		success: true,
		order,
	});
});

// Get single order details
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
	const order = await Order.findById(req.params.id).populate(
		'user',
		'name email'
	);

	if (!order) {
		return next(
			new ErrorHandler(
				`Order not found with id: ${req.params.id}`,
				404
			).getError(res)
		);
	}

	res.status(200).json({
		success: true,
		order,
	});
});

// Get logged in Orders
exports.myOrders = catchAsyncError(async (req, res, next) => {
	const orders = await Order.find({ user: req.user._id });

	res.status(200).json({
		success: true,
		orders,
	});
});

// @Auth: Admin
// Get all Orders
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
	const orders = await Order.find();

	let totalAmount = 0;
	orders.forEach((order) => {
		totalAmount += order.totalPrice;
	});

	res.status(200).json({
		success: true,
		orders,
		totalAmount,
	});
});

// @Auth: Admin
// Update Order status
exports.updateOrder = catchAsyncError(async (req, res, next) => {
	const order = await Order.findById(req.params.id);

	if (!order) {
		return next(
			new ErrorHandler(
				`Order not found with id: ${req.params.id}`,
				404
			)
		);
	}

	if (order.orderStatus == 'Delivered') {
		return next(
			new ErrorHandler(
				'You have already delivered this order',
				400
			)
		);
	}

	// Only decrement stock if the status is changing from Processing to Shipped/Delivered
	if (order.orderStatus === 'Processing' && (req.body.status === 'Shipped' || req.body.status === 'Delivered')) {
		for (const singleOrder of order.orderItems) {
			await updateStock(singleOrder.product, singleOrder.quantity);
		}
	}

	if (req.body.status) {
		order.orderStatus = req.body.status;
	}

	if (req.body.trackingNumber) {
		order.trackingNumber = req.body.trackingNumber;
	}

	if (req.body.status === 'Delivered') {
		order.deliveredAt = Date.now();
	}

	await order.save({ validateBeforeSave: false });
	res.status(200).json({
		success: true,
		order,
	});
});

async function updateStock(id, quantity) {
	const product = await Product.findById(id);
	product.stock -= quantity;
	await product.save({ validateBeforeSave: false });
}

// @Auth: Admin
// Delete Order
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
	const order = await Order.findById(req.params.id);

	await order.deleteOne();
	if (!order) {
		return next(
			new ErrorHandler(
				`Order not found with id: ${req.params.id}`,
				404
			).getError(res)
		);
	}
	res.status(200).json({
		success: true,
	});
});
