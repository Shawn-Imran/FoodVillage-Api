const express = require('express');

// Imports
const controller = require('../controller/gallery');
const checkAdminAuth = require('../middileware/check-admin-auth');
const checkIpWhitelist = require('../middileware/check-ip-whitelist');


// Get Express Router Function..
const router = express.Router();

/**
 * /api/gallery
 * http://localhost:3000/api/gallery
 */

router.post('/add-new-gallery', controller.addNewGalleryImage);
router.post('/add-new-gallery-multi', controller.addNewGalleryMultiImage);
router.get('/get-all-gallery-list', controller.getAllGalleryImage);
router.get('/get-gallery-details-by-id/:id', controller.getSingleGalleryImageById);
router.delete('/delete-gallery-by-id/:id', controller.deleteGalleryImageById);
router.post('/delete-gallery-images-multi', controller.deleteGalleryImageMulti);
router.put('/edit-gallery-by-id', controller.editGalleryImageData);
router.get('/search-image-by-regex', controller.getSearchImageByRegex);


// Export router class..
module.exports = router;
