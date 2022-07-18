// Main Module Required..
const express = require('express');

// Created Require Files..
const controller = require('../controller/user');
const checkAuth = require('../middileware/check-user-auth');
const checkIpAddress = require('../middileware/check-ip-address');
const checkIpAccess = require('../middileware/check-ip-access');

const router = express.Router();

/**
 * /api/user
 * http://localhost:3000/api/user
 */


router.post('/registration', controller.userRegistrationDefault);
router.post('/login', controller.userLoginDefault);
router.get('/logged-in-user-data', checkAuth, controller.getLoginUserInfo);
router.put('/edit-logged-in-user-data', checkAuth, controller.editLoginUserInfo);
router.get('/check-user-by-phone/:phoneNo', controller.checkUserByPhone);
router.get('/get-all-users', checkIpAccess, controller.getUserLists);


// Export All router..
module.exports = router;
