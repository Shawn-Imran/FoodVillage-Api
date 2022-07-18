// Main Module Required..
const express = require('express');

// Created Require Files..
const controller = require('../controller/setting');
const checkAdminAuth = require('../middileware/check-admin-auth');
const checkIpWhitelist = require('../middileware/check-ip-whitelist');
const router = express.Router();

/**
 * setting
 * http://localhost:3000/api/setting
 */


 router.post('/set-setting-info',checkIpWhitelist,checkAdminAuth, controller.setSettingInfo);
 router.get('/get-setting-info', controller.getSettingInfo);
 router.put('/edit-setting-info',checkIpWhitelist,checkAdminAuth, controller.editSettingInfo);
 

// Export All router..
module.exports = router;
