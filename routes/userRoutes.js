const express = require('express');
const fs = require('fs');
const path = require('path');
const {
	registerUser,
	loginUser,
	logoutUser,
	forgotPassword,
	resetPassword,
	getUserDetails,
	updateUserPassword,
	updateUserProfile,
	getAllUsers,
	getSingleUser,
	deleteUserProfile,
	updateUserRole, sendModel
} = require('../controllers/userController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/me').get(isAuthenticatedUser, getUserDetails);
router.route('/me/update').put(isAuthenticatedUser, updateUserProfile);
router.route('/password/update').put(isAuthenticatedUser, updateUserPassword);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);
router.route('/logout').get(logoutUser);
router.route('/model/:model').get(sendModel);

router
	.route('/admin/users')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router
	.route('/admin/user/:id')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getSingleUser)
	.put(isAuthenticatedUser, authorizeRoles('admin'), updateUserRole)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUserProfile);
// Newsletter Subscription
const subscribersFile = path.join(__dirname, '../config/subscribers.json');
router.route('/subscribe').post((req, res) => {
    try {
        const { email } = req.body;
        console.log('Newsletter subscription request for:', email);
        
        if (!email) {
            console.log('Error: Email missing');
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        let subscribers = [];
        if (fs.existsSync(subscribersFile)) {
            const fileData = fs.readFileSync(subscribersFile, 'utf8');
            try {
                subscribers = JSON.parse(fileData);
            } catch (e) {
                console.error('Error parsing subscribers file, resetting to empty array');
                subscribers = [];
            }
        }
        
        if (!subscribers.includes(email)) {
            subscribers.push(email);
            fs.writeFileSync(subscribersFile, JSON.stringify(subscribers));
            console.log('Subscribed successfully:', email);
        } else {
            console.log('User already subscribed:', email);
        }

        res.status(200).json({ success: true, message: "Subscribed successfully!" });
    } catch (err) {
        console.error('Newsletter Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
