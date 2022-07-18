const express = require('express');

// Imports
const controller = require('../controller/cart');
const checkAuth = require('../middileware/check-user-auth');

// Get Express Router Function..
const router = express.Router();

/**
 * /api/cart
 * http://localhost:3000/api/cart
 */

router.post('/add-to-cart', checkAuth, controller.addToCart);
router.get('/get-cart-items-by-user', checkAuth, controller.getCartItemByUserId);
router.post('/increment-cart-item-quantity', checkAuth, controller.incrementCartQty);
router.post('/decrement-cart-item-quantity', checkAuth, controller.decrementCartQty);
router.delete('/remove-cart-item/:cartId', checkAuth, controller.deleteCartItem);
router.get('/cart-item-count', checkAuth, controller.getCartItemCount);
router.get('/get-status-book-on-cart/:bookId', checkAuth, controller.getSingleCartProduct);


// Export router class..
module.exports = router;

