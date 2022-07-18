const express = require('express');

// Imports
const controller = require('../controller/image-folder');
const checkAdminAuth = require('../middileware/check-admin-auth');
const checkIpWhitelist = require('../middileware/check-ip-whitelist');

// Get Express Router Function..
const router = express.Router();

/**
 * /api/image-folder
 * http://localhost:3000/api/image-folder
 */

router.post('/add-new-image-folder', controller.addNewImageFolder);
router.post('/add-new-image-folder-multi', controller.addNewImageFolderMulti);
router.get('/get-all-image-folder-list', controller.getAllImageFolder);
router.get('/get-image-folder-details-by-id/:id', controller.getSingleImageFolderById);
router.delete('/delete-image-folder-by-id/:id', controller.deleteImageFolderById);
router.post('/delete-image-folder-images-multi', controller.deleteImageFolderMulti);
router.put('/edit-image-folder-by-id', controller.editImageFolderData);


// Export router class..
module.exports = router;
