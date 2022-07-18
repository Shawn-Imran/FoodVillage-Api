const express = require('express');

// Created Require Files..
const controller = require('../controller/upload');

const checkAuth = require('../middileware/check-user-auth');
const checkAdminAuth = require('../middileware/check-admin-auth');
// Get Express Router Function..
const router = express.Router();

/**
 * /api/upload
 * http://localhost:3000/api/upload
 */
// router.post('/single-image-to-multi-convert', controller.multerConfigSingleToMulti.single(process.env.AVATAR_FIELD), controller.uploaderImageSingleToMulti);
router.post('/single-image-original', controller.multerConfigSingleImageOriginal.single(process.env.ORIGINAL_IMAGE_FIELD), controller.uploaderImageOriginal);
router.post('/multi-image-original', controller.multerConfigSingleImageOriginal.array(process.env.MULTI_IMAGE_FIELD,20), controller.uploaderImageMulti);
router.post('/single-pdf', controller.multerConfigPdf.single(process.env.PDF_FIELD), controller.uploaderPdf);
// Remove
router.post('/remove-file-multi', controller.removeFileMulti);
router.post('/remove-file-from-array', controller.removeFileFromArray);
router.post('/remove-file-single', controller.removeSingleFile);


// Export All router..
module.exports = router;
