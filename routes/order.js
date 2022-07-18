const express = require('express');

// Imports
const controller = require('../controller/order');
const checkAuth = require('../middileware/check-user-auth');
const checkAdminAuth = require('../middileware/check-admin-auth');
const checkIpWhitelist = require('../middileware/check-ip-whitelist');

// Get Express Router Function..
const router = express.Router();

/**
 * /api/order
 * http://localhost:3000/api/order
 */

// USER

router.post('/place-order', checkAuth, controller.placeOrder);
router.get('/get-all-orders-by-user', checkAuth, controller.getAllOrdersByUser);
router.get('/get-order-details/:id', controller.getOrderDetailsById);
router.get('/get-all-transactions-by-user', checkAuth, controller.getAllTransactionByUser);
router.get("/get-single-order-by-user/:orderId", checkAuth, controller.getSingleOrderByUser);
router.get("/get-single-order-by-user-admin/:orderId",checkIpWhitelist, checkAdminAuth, controller.getSingleOrderByUser);
router.put('/cancel-order-by-user/:orderId', checkAuth, controller.cancelOrderByUser);
router.post('/get-order-by-search', controller.getOrdersBySearch);
router.put('/update-multiple-order-by-id', checkIpWhitelist,checkAdminAuth, controller.updateMultipleOrder);


// ADMIN

router.get("/get-single-order-by-admin/:orderId",checkIpWhitelist, checkAdminAuth, controller.getSingleOrderByAdmin);
router.post('/get-all-orders-by-admin',checkIpWhitelist, checkAdminAuth, controller.getAllOrdersByAdmin);
router.post('/get-pending-orders-by-admin',checkIpWhitelist, checkAdminAuth, controller.getPendingOrdersByAdmin);
router.get('/get-all-transaction-by-admin',checkIpWhitelist, checkAdminAuth, controller.getAllTransactionByAdmin);
router.get("/get-all-orders-by-userId/:userId",checkIpWhitelist, checkAdminAuth, controller.getUserOrdersByAmin);
router.get('/get-all-canceled-orders',checkIpWhitelist, checkAdminAuth, controller.getAllCanceledOrdersByAdmin);
router.get('/get-all-orders-by-admin-no-paginate',checkIpWhitelist, checkAdminAuth, controller.getAllOrdersByAdminNoPaginate);
router.put('/change-order-status',checkIpWhitelist, checkAdminAuth, controller.changeDeliveryStatus);
router.delete('/delete-order-by-admin/:orderId',checkIpWhitelist, checkAdminAuth, controller.deleteOrderByAdmin);
router.post('/get-orders-by-filter-data/:deliveryStatus',checkIpWhitelist, checkAdminAuth, controller.filterByDynamicFilters);
router.post('/get-orders-by-date-range-data/:startDate/:endDate',checkIpWhitelist, checkAdminAuth, controller.filterByDateRange);
router.get('/sent-test-ssl-message', controller.testSslSmsApi);
router.post('/get-multiple-order-by-admin-by-id',checkIpWhitelist, checkAdminAuth,controller.getMultipleOrderById)

// Export router class..
module.exports = router;
