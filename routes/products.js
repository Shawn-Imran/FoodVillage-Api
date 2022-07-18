// Main Module Required..
const express = require('express');

// Created Require Files..
const controller = require('../controller/products');

const checkAuth = require('../middileware/check-user-auth');
const checkAdminAuth = require('../middileware/check-admin-auth');
const router = express.Router();

/**
 * http://localhost:3000/api/admin/products
 */


router.post('/add-product', controller.addProduct);
router.get('/get-all-products', controller.getAllProducts);
router.get('/productsList', controller.productsList);
router.get('/get-product-by-product-id/:id', controller.getProductByProductId);
router.put('/edit-product-by-id', controller.editProductData);
router.delete('/delete-product-by-id/:id', controller.deleteProductByProductId);


router.post('/get-specific-products-by-ids', controller.getSpecificProductsByIds);
router.post('/get-specific-products-by-id', controller.getSpecificProductsById);
// Export All router..
module.exports = router;