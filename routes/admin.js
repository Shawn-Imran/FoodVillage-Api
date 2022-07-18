// Main Module Required..
const express = require('express');

// Created Require Files..
const controller = require('../controller/admin');
const inputValidator = require('../validation/admin');
const checkAdminAuth = require('../middileware/check-admin-auth');
const checkIpWhitelist = require('../middileware/check-ip-whitelist');

// Get Express Router Function..
const router = express.Router();

/**
 * /api/admin
 * http://localhost:3000/api/admin
 */

router.post('/registration', controller.adminSignUp);
router.put('/login', controller.adminLogin);
router.get('/get-logged-in-admin-info',checkIpWhitelist, checkAdminAuth, controller.getLoginAdminInfo);
router.put('/edit-logged-in-admin-info',checkIpWhitelist, checkAdminAuth, controller.editAdminOwnProfileInfo);
router.put('/change-logged-in-admin-password',checkIpWhitelist, checkAdminAuth, controller.changeAdminOwnPassword);
router.get('/get-logged-in-admin-role', checkAdminAuth, controller.getLoginAdminRole);
router.get('/get-all-admin-list', checkAdminAuth, controller.getAdminLists);
router.get('/get-single-admin-by-id/:id', controller.getSingleAdminById);
// Modify
router.delete('/delete-admin-by-id/:id',checkIpWhitelist, checkAdminAuth, controller.deleteAdminById);
router.put('/edit-admin-info/:id',checkIpWhitelist, checkAdminAuth, controller.editAdmin);
router.post('/update-admin-images',checkIpWhitelist, checkAdminAuth, controller.updateAdminImageField);

// Role
router.post('/add-admin-role',checkIpWhitelist, controller.addAdminRole);
router.get('/get-all-admin-roles', checkAdminAuth, controller.getRolesData);
router.get('/get-admin-role-by-id/:id', checkAdminAuth, controller.getSingleRoleById);
router.delete('/delete-admin-role-by-id/:id',checkIpWhitelist, checkAdminAuth, controller.deleteAdminRoleById);
router.put('/edit-admin-role',checkIpWhitelist, checkAdminAuth, controller.editAdminRole);

// DEFAULT DATA
router.post('/add-default-data', controller.insertDefaultDocuments);

// Counts
// router.get('/counts-collection-documents', checkAdminAuth, controller.countsCollectionsDocuments);

// Export All router..
module.exports = router;
