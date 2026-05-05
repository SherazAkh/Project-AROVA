module.exports = checkout = async (req, res) => {
    // Mocking Razorpay checkout order creation
    const order = {
        id: `mock_order_${Math.floor(Math.random() * 100000)}`,
        amount: req.body.amount || 5000,
        currency: 'INR',
        status: 'created'
    };
    console.log("Mock Payment Order created:", order);
    res.status(200).json({ success: true, order });
};