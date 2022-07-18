const { validationResult } = require('express-validator');
const ObjectId = require('mongoose').Types.ObjectId;


// Require Post Schema from Model..

const Order = require('../models/order');
const User = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/products");
const Coupon = require('../models/coupon');
const UniqueId = require('../models/unique-id');
const enumObj = require('../helpers/enum-obj');
const ax = require("axios");
const utils = require('../helpers/utils')


/**
 * Add To ORDER
 * GET ORDER LIST
 */

exports.placeOrder = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Input Validation Error! Please complete required information.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error)
        return;
    }

    try {

        const userId = req.userData.userId;
        // Increment Order Id Unique
        const incOrder = await UniqueId.findOneAndUpdate(
            {},
            { $inc: { orderId: 1 } },
            { new: true, upsert: true }
        )
        const orderIdUnique = padLeadingZeros(incOrder.orderId);
        const finalData = { ...req.body, ...{ user: userId, orderId: orderIdUnique } }
        const order = new Order(finalData);
        const orderSave = await order.save();

        if (req.body.couponId) {
            await Coupon.findByIdAndUpdate({ _id: req.body.couponId }, { $push: { couponUsedByUser: userId } });
        }

        // UPDATE USER CARTS & CHECKOUT
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { carts: [] }, $push: { checkouts: orderSave._id, usedCoupons: req.body.couponId } }
        )


        await Cart.deleteMany({ user: new ObjectId(userId) });

        // Update Quantity

        const orderDB = await Order.findOne({ _id: orderSave._id })
            .populate(
                {
                    path: 'orderedItems.product',
                    model: 'Product',
                    select: 'soldQuantity quantity'
                }
            );

        if (orderDB && orderDB.orderedItems.length) {
            const mOrderProducts = orderDB.orderedItems.map(m => {
                return {
                    _id: m.product._id,
                    soldQuantity: m.quantity,
                    productSoldQty: m.product.soldQuantity,
                    productQty: m.product.quantity,
                }
            });
            mOrderProducts.forEach(m => {
                // Create Complex Query
                const q1 = incrementSoldQuantityQuery(m);
                const q2 = decrementQuantityQuery(m);
                let finalQuery;
                if (q1.$inc && q2.$inc) {
                    finalQuery = { $inc: { soldQuantity: q1.$inc.soldQuantity, quantity: q2.$inc.quantity } }
                } else {
                    finalQuery = { ...q1, ...q2 };
                }

                // Update Product Data
                Product.updateOne({ _id: m._id },
                    finalQuery,
                    { new: true, upsert: true, multi: true }).exec()
            });
        }

        res.json({
            _id: orderSave._id,
            orderId: orderIdUnique,
            success: true,
            message: 'Order Placed successfully',
        })

    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

// exports.getAllOrdersByUser = async (req, res, next) => {
//     try {
//         const orders = await User.findById(req.userData.userId)
//             .populate('checkouts')
//             .select('checkouts -_id');
//
//         res.json({
//             data: orders ? orders.orders : orders
//         })
//
//     } catch (error) {
//         res.json({
//             success: false,
//             errorMsg: error.message,
//             message: "Something went Wrong"
//         })
//         next(error);
//     }
// }

exports.getAllOrdersByUser = async (req, res, next) => {
    try {

        const userId = req.userData.userId;

        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let select = req.query.select;

        let queryData;
        queryData = Order.find({ user: userId });
        let data;

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        data = await queryData.select(select ? select : '').sort({ createdAt: -1 });

        const dataCount = await Order.countDocuments({ user: userId });

        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'Order get Successfully!'
        });
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getOrderDetailsById = async (req, res, next) => {

    const orderId = req.params.id;

    try {
        const query = { _id: orderId }
        const data = await Order.findOne(query)
            .select('-updatedAt -sessionkey -orderPaymentInfo')
            .populate(
                {
                    path: 'orderedItems.product',
                    model: 'Product',
                    select: 'productName productSlug price category categorySlug subCategory subCategorySlug brand brandSlug images'
                }
            )

        res.status(200).json({
            data: data,
            message: 'Cart removed Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.cancelOrderByUser = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        let order = await Order.findById(orderId);

        if (order.deliveryStatus === enumObj.Order.PENDING && order.paymentStatus === 'unpaid') {
            order.deliveryStatus = enumObj.Order.CANCEL;
            await order.save();

            res.status(200).json({
                message: 'Order has been canceled',
                status: 1
            });
        } else {
            res.status(200).json({
                message: 'You can\'t cancel this order. Please contact with seller',
                status: 0
            });
        }

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getAllTransactionByUser = async (req, res, next) => {
    try {

        const userId = req.userData.userId;

        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let select = req.query.select;

        let data;
        let queryData;
        queryData = Order.find({
            $and: [
                { user: userId },
                {
                    $or: [
                        { deliveryStatus: enumObj.Order.DELIVERED },
                        { paymentStatus: 'paid' }
                    ]
                }
            ]
        });

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        data = await queryData.select(select ? select : '').sort({ createdAt: -1 });

        const dataCount = await Order.countDocuments();

        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'Transaction get Successfully!'
        });
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.getAllOrdersByAdmin = async (req, res, next) => {
    try {
        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let select = req.query.select;
        let query = req.body.query;

        let dataCount;
        let queryData;
        if (query) {
            queryData = Order.find(query).sort({ createdAt: -1 });
            dataCount = await Order.countDocuments(query);
        } else {
            queryData = Order.find().sort({ createdAt: -1 });
            dataCount = await Order.countDocuments();
        }
        let data;

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        data = await queryData.select(select ? select : '');

        // console.log(data);
 

        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'Order get Successfully!'
        });
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.getPendingOrdersByAdmin = async (req, res, next) => {
    try {
        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let select = req.query.select;
        let query = req.body.query;

        let dataCount;
        let queryData;
        if (query) {
            queryData = Order.find({ deliveryStatus: enumObj.Order.PENDING }).sort({ createdAt: -1 });
            dataCount = await Order.countDocuments({ deliveryStatus: enumObj.Order.PENDING });
        } else {
            queryData = Order.find({ deliveryStatus: enumObj.Order.PENDING }).sort({ createdAt: -1 });
            dataCount = await Order.countDocuments();
        }
        let data;

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        data = await queryData.select(select ? select : '');

        // console.log(data);


        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'Order get Successfully!'
        });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getAllTransactionByAdmin = async (req, res, next) => {
    try {

        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let select = req.query.select;

        let data;
        let queryData;
        queryData = Order.find({
            $and: [
                {
                    $or: [
                        { deliveryStatus: enumObj.Order.DELIVERED },
                        { paymentStatus: 'paid' }
                    ]
                }
            ]
        });

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        data = await queryData.select(select ? select : '').sort({ createdAt: -1 });

        const dataCount = await Order.countDocuments();

        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'Transaction get Successfully!'
        });
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}



exports.getOrdersBySearch = async (req, res, next) => {
    try {

        // Query Text
        const search = req.query.q;

        // Additional Filter
        const filter = req.body.filter;

        // Pagination
        const pageSize = +req.query.pageSize;
        const currentPage = +req.query.currentPage;

        // Build Regex Query
        const newQuery = search.split(/[ ,]+/);
        const queryArray = newQuery.map((str) => ({ name: RegExp(str, 'i') }));
        const queryArray2 = newQuery.map((str) => ({ phoneNo: RegExp(str, 'i') }));
        const queryArray3 = newQuery.map((str) => ({ orderId: RegExp(str, 'i') }));
        // const queryArray3 = newQuery.map((str) => ({phoneNo: RegExp(str, 'i')}));
        // const queryArray4 = newQuery.map((str) => ({username: RegExp(str, 'i')}));
        // const regex = new RegExp(query, 'i')


        let dataDoc;
        let countDoc;

        if (filter) {
            dataDoc = Order.find({
                $and: [
                    filter,
                    {
                        $or: [
                            { $and: queryArray },
                            { $and: queryArray2 },
                            { $and: queryArray3 },
                            // {$and: queryArray4},
                        ]
                    }
                ]
            });

            countDoc = Order.countDocuments({
                $and: [
                    filter,
                    {
                        $or: [
                            { $and: queryArray },
                            { $and: queryArray2 },
                            { $and: queryArray3 },
                            // {$and: queryArray4},
                        ]
                    }
                ]
            });
        } else {
            dataDoc = Order.find({
                $or: [
                    { $and: queryArray },
                    { $and: queryArray2 },
                    { $and: queryArray3 },
                    // {$and: queryArray4},
                ]
            });

            countDoc = Order.countDocuments({
                $or: [
                    { $and: queryArray },
                    { $and: queryArray2 },
                    { $and: queryArray3 },
                    // {$and: queryArray4},
                ]
            });
        }


        // {marketer: {$in: [null]}}

        if (pageSize && currentPage) {
            dataDoc.skip(pageSize * (currentPage - 1)).limit(Number(pageSize))
        }

        const results = await dataDoc;
        const count = await countDoc;


        res.status(200).json({
            data: results,
            count: count
        });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getSingleOrderByUser = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate({
                path: 'orderedBooks.bookId',
                model: 'Book',
                select: '_id name slug image price discountPercent availableQuantity author authorName categoryName',
            })

        res.json({
            data: order
        })
    } catch (error) {
        res.json({
            success: false,
            message: "Something went Wrong"
        })
        next(error);
    }
}

exports.getSingleOrderByAdmin = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId);

        res.json({
            success: true,
            data: order
        })
    } catch (error) {
        res.json({
            success: false,
            message: "Somrthing went Wrong"
        })
        next(error);
    }
}


exports.getUserOrdersByAmin = async (req, res, next) => {
    try {
        const order = await Order.find({ userId: req.params.userId });
        res.json({
            success: true,
            data: order
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.deleteOrderByAdmin = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId);
        const userId = order.userId;

        await User.updateOne(
            { _id: userId },
            {
                $pull: { orders: order._id }
            }
        )

        await Order.findByIdAndDelete(req.params.orderId);

        res.json({
            message: "Order is deleted"
        })
    } catch (err) {
        // console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getAllCanceledOrdersByAdmin = async (req, res, next) => {
    try {
        const orders = await Order.find({ deliveryStatus: 6 });
        res.json({
            success: true,
            data: orders
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.getAllOrdersByAdminNoPaginate = async (req, res, next) => {
    try {

        const order = await Order.find()
            .populate(
                {
                    path: 'orderedItems.product',
                    model: 'Product',
                    select: 'productName productSlug price category categorySlug subCategory subCategorySlug brand brandSlug images'
                }
            )
            .sort({ createdAt: -1 });
        const message = "Successfully retrieved orders";

        res.status(200).json({
            data: order,
            message: message
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.updateMultipleOrder = async (req, res, next) => {
    const data = req.body;


    try {
        
        data.forEach(async (m) => {

           
            Order.findByIdAndUpdate(m._id,
                { $set: m },
                { new: true, multi: true }
            ).exec()



            // START SMS

            const smsData = {
                user: process.env.SMSUSER,
                pass: process.env.SMSPASS,
                msisdn: '88' + m.phoneNo,
                sms: '',
                sid: process.env.SMSSID,
                csmsid: m.phoneNo
            }

            let updatePhase;
            let updatePhaseDate;
            let nextUpdatePhaseDate;

            switch (m.deliveryStatus) {
                case enumObj.Order.CONFIRM:
                    updatePhase = 'orderTimeline.orderPlaced';
                    updatePhaseDate = 'orderTimeline.orderPlacedDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderProcessingDate';
                    smsData.sms = `Dear ${m.name}, Your order ${m.orderId ? m.orderId : m._id} is confirmed. For Support: 8809610001010.`;
                    break;
                case enumObj.Order.PROCESSING:
                    updatePhase = "orderTimeline.orderProcessing";
                    updatePhaseDate = 'orderTimeline.orderProcessingDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                    smsData.sms = `Dear ${m.name}, We have started processing your order ${m.orderId ? m.orderId : m._id}. For Support: 8809610001010.`;
                    break;
                case enumObj.Order.SHIPPING:
                    updatePhase = 'orderTimeline.orderPickedByDeliveryMan';
                    updatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderDeliveredDate';
                    smsData.sms = `Dear ${m.name}, We have handed over your order ${m.orderId ? m.orderId : m._id} to our delivery partner. Your product will be delivered soon.`;
                    break;
                case enumObj.Order.DELIVERED:
                    updatePhase = "orderTimeline.orderDelivered";
                    updatePhaseDate = 'orderTimeline.orderDeliveredDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.name}, Your order ${m.orderId ? m.orderId : m._id} is now delivered. Thank you for shopping at www.esquireelectronicsltd.com.`;
                    break;
                case enumObj.Order.CANCEL:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.name}, Your order ${m.orderId ? m.orderId : m._id} is canceled. Please order again at www.esquireelectronicsltd.com.`;
                    break;
                case enumObj.Order.REFUND:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.name}, Your order ${m.orderId ? m.orderId : m._id} valued BDT ${m.totalAmount} is refunded to your account. The refund will take some days to reflect on your account statement. For Support: 8809610001010.`;
                    break;
                default:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = 'Dear ' + m.name + ', your order no. ' + req.body._id + ' has changed in status on ' + req.body.updateDate + "please log into your account and check your order details. Esquire Electronics Limited.";
            }


            const updateDate = utils.getDateString(new Date());
            const nextPhaseDate = m.nextPhaseDate;
        
            await Order.findOneAndUpdate({ _id: m._id }, {
                "$set":
                {
                    [updatePhase]: true,
                    [updatePhaseDate]: updateDate,
                    [nextUpdatePhaseDate]: nextPhaseDate,
                    "deliveryStatus": m.deliveryStatus
                }
            });

            /**
             * SMS SENT SSL
             */
            const apiEnd = "https://sms.sslwireless.com/pushapi/dynamic/server.php";
            ax.get(apiEnd, {
                params: smsData
            })
                .then(function (response) {
                    console.log("response:");
                })
                .catch(function (error) {
                    console.log("error:");
                });


                // END SMS


        });

        res.status(200).json({
            message: 'Bulk Order Update Successfully!'
        });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.updateBulkOrderStatus = async (req, res, next) => {
    const data = req.body;

    try {
        // console.log(data[0]);
        // console.log(data[0]._id);
        data.forEach(async (m) => {

            // const order = req.body;


            Order.findByIdAndUpdate(m._id,
                { $set: m },
                { new: true, multi: true }
            ).exec()

            // console.log(m.phoneNo);



            // START SMS

            const smsData = {
                user: process.env.SMSUSER,
                pass: process.env.SMSPASS,
                msisdn: '88' + m.phoneNo,
                sms: '',
                sid: process.env.SMSSID,
                csmsid: m.phoneNo
            }

            let updatePhase;
            let updatePhaseDate;
            let nextUpdatePhaseDate;

            switch (m.deliveryStatus) {
                case enumObj.Order.CONFIRM:
                    updatePhase = 'orderTimeline.orderPlaced';
                    updatePhaseDate = 'orderTimeline.orderPlacedDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderProcessingDate';
                    smsData.sms = `Dear ${m.fullName}, Your order ${m.orderId ? m.orderId : m._id} is confirmed. For Support: 8809610001010.`;
                    break;
                case enumObj.Order.PROCESSING:
                    updatePhase = "orderTimeline.orderProcessing";
                    updatePhaseDate = 'orderTimeline.orderProcessingDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                    smsData.sms = `Dear ${m.fullName}, We have started processing your order ${m.orderId ? m.orderId : m._id}. For Support: 8809610001010.`;
                    break;
                case enumObj.Order.SHIPPING:
                    updatePhase = 'orderTimeline.orderPickedByDeliveryMan';
                    updatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                    nextUpdatePhaseDate = 'orderTimeline.orderDeliveredDate';
                    smsData.sms = `Dear ${m.fullName}, We have handed over your order ${m.orderId ? m.orderId : m._id} to our delivery partner. Your product will be delivered soon.`;
                    break;
                case enumObj.Order.DELIVERED:
                    updatePhase = "orderTimeline.orderDelivered";
                    updatePhaseDate = 'orderTimeline.orderDeliveredDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.fullName}, Your order ${m.orderId ? m.orderId : m._id} is now delivered. Thank you for shopping at www.esquireelectronicsltd.com.`;
                    break;
                case enumObj.Order.CANCEL:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.fullName}, Your order ${m.orderId ? m.orderId : m._id} is canceled. Please order again at www.esquireelectronicsltd.com.`;
                    break;
                case enumObj.Order.REFUND:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = `Dear ${m.fullName}, Your order ${m.orderId ? m.orderId : m._id} valued BDT ${m.totalAmount} is refunded to your account. The refund will take some days to reflect on your account statement. For Support: 8809610001010.`;
                    break;
                default:
                    updatePhase = "orderTimeline.others";
                    updatePhaseDate = 'orderTimeline.othersDate';
                    nextUpdatePhaseDate = 'orderTimeline.othersDate';
                    smsData.sms = 'Dear ' + m.fullName + ', your order no. ' + req.body._id + ' has changed in status on ' + req.body.updateDate + "please log into your account and check your order details. Esquire Electronics Limited.";
            }


            const updateDate = req.body.updateDate;
            const nextPhaseDate = req.body.nextPhaseDate;
            await Order.findOneAndUpdate({ _id: req.body._id }, {
                "$set":
                {
                    [updatePhase]: true,
                    [updatePhaseDate]: updateDate,
                    [nextUpdatePhaseDate]: nextPhaseDate,
                    "deliveryStatus": m.deliveryStatus
                }
            });

            // console.log(smsData)

            /**
             * SMS SENT SSL
             */
            const apiEnd = "https://sms.sslwireless.com/pushapi/dynamic/server.php";
            ax.get(apiEnd, {
                params: smsData
            })
                .then(function (response) {
                    console.log("response:");
                })
                .catch(function (error) {
                    console.log("error:");
                });


                // END SMS


        });

        res.status(200).json({
            message: 'Bulk Order Update Successfully!'
        });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.changeDeliveryStatus = async (req, res, next) => {
    try {
       // console.log(req.body);
       deliveredQuantity = false;
        const deliveryStatus = req.body.deliveryStatus;

        const order = await Order.findOne({ _id: req.body._id }).populate('user');
        

        console.log('My Order Data')
        console.log(order)

        const smsData = {
            user: process.env.SMSUSER,
            pass: process.env.SMSPASS,
            msisdn: '88' + order.user.phoneNo,
            sms: '',
            sid: process.env.SMSSID,
            csmsid: order.user.phoneNo
        }

        let updatePhase;
        let updatePhaseDate;
        let nextUpdatePhaseDate;

        switch (deliveryStatus) {
            case enumObj.Order.CONFIRM:
                updatePhase = 'orderTimeline.orderPlaced';
                updatePhaseDate = 'orderTimeline.orderPlacedDate';
                nextUpdatePhaseDate = 'orderTimeline.orderProcessingDate';
                smsData.sms = `Dear ${order.user.fullName}, Your order ${order.orderId ? order.orderId : order._id} is confirmed. For Support: 8809610001010.`;
                break;
            case enumObj.Order.PROCESSING:
                updatePhase = "orderTimeline.orderProcessing";
                updatePhaseDate = 'orderTimeline.orderProcessingDate';
                nextUpdatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                smsData.sms = `Dear ${order.user.fullName}, We have started processing your order ${order.orderId ? order.orderId : order._id}. For Support: 8809610001010.`;
                break;
            case enumObj.Order.SHIPPING:
                updatePhase = 'orderTimeline.orderPickedByDeliveryMan';
                updatePhaseDate = 'orderTimeline.orderPickedByDeliveryManDate';
                nextUpdatePhaseDate = 'orderTimeline.orderDeliveredDate';
                smsData.sms = `Dear ${order.user.fullName}, We have handed over your order ${order.orderId ? order.orderId : order._id} to our delivery partner. Your product will be delivered soon.`;
                break;
            case enumObj.Order.DELIVERED:
                console.log('enum obj', enumObj)
                updatePhase = "orderTimeline.orderDelivered";
                updatePhaseDate = 'orderTimeline.orderDeliveredDate';
                nextUpdatePhaseDate = 'orderTimeline.othersDate';
                deliveredQuantity = true;
                smsData.sms = `Dear ${order.user.fullName}, Your order ${order.orderId ? order.orderId : order._id} is now delivered. Thank you for shopping at www.esquireelectronicsltd.com.`;
                break;
            case enumObj.Order.CANCEL:
                updatePhase = "orderTimeline.others";
                updatePhaseDate = 'orderTimeline.othersDate';
                nextUpdatePhaseDate = 'orderTimeline.othersDate';
                smsData.sms = `Dear ${order.user.fullName}, Your order ${order.orderId ? order.orderId : order._id} is canceled. Please order again at www.esquireelectronicsltd.com.`;
                break;
            case enumObj.Order.REFUND:
                updatePhase = "orderTimeline.others";
                updatePhaseDate = 'orderTimeline.othersDate';
                nextUpdatePhaseDate = 'orderTimeline.othersDate';
                smsData.sms = `Dear ${order.user.fullName}, Your order ${order.orderId ? order.orderId : order._id} valued BDT ${order.totalAmount} is refunded to your account. The refund will take some days to reflect on your account statement. For Support: 8809610001010.`;
                break;
            default:
                updatePhase = "orderTimeline.others";
                updatePhaseDate = 'orderTimeline.othersDate';
                nextUpdatePhaseDate = 'orderTimeline.othersDate';
                smsData.sms = 'Dear ' + order.user.fullName + ', your order no. ' + req.body._id + ' has changed in status on ' + req.body.updateDate + "please log into your account and check your order details. Esquire Electronics Limited.";
        }

        const updateDate = req.body.updateDate;
        const nextPhaseDate = req.body.nextPhaseDate;
        await Order.findOneAndUpdate({ _id: req.body._id }, {
            "$set":
            {
                [updatePhase]: true,
                [updatePhaseDate]: updateDate,
                [nextUpdatePhaseDate]: nextPhaseDate,
                "deliveryStatus": deliveryStatus
            }
        });

        if(deliveredQuantity === true){
            for (let i=0; i<order.orderedItems.length; i++) {
                await Product.findOneAndUpdate({ _id: order.orderedItems[i].product }, {
                    "$inc":
                    {
                        "deliveredQuantity": order.orderedItems[i].quantity
                    }
                });
            }
        }

        /**
         * SMS SENT SSL
         */
        const apiEnd = "https://sms.sslwireless.com/pushapi/dynamic/server.php";
        ax.get(apiEnd, {
            params: smsData
        })
            .then(function (response) {
                console.log("response:");
            })
            .catch(function (error) {
                console.log("error:");
            });


        // if (req.body.deliveryStatus === enumObj.Order.DELIVERED) {
        //     await Order.findOneAndUpdate({_id: req.body._id}, {$set: {paymentStatus: 'paid'}});
        //     const order = await Order.findOne({_id: req.body._id})
        //         .populate(
        //             {
        //                 path: 'orderedItems.product',
        //                 model: 'Product',
        //                 select: 'soldQuantity quantity'
        //             }
        //         );
        //
        //     if (order && order.orderedItems.length) {
        //         const mOrderProducts = order.orderedItems.map(m => {
        //             return {
        //                 _id: m.product._id,
        //                 soldQuantity: m.quantity,
        //                 productSoldQty: m.product.soldQuantity,
        //                 productQty: m.product.quantity,
        //             }
        //         });
        //         mOrderProducts.forEach(m => {
        //             // Create Complex Query
        //             const q1 = incrementSoldQuantityQuery(m);
        //             const q2 = decrementQuantityQuery(m);
        //             let finalQuery;
        //             if (q1.$inc && q2.$inc) {
        //                 finalQuery = {$inc: {soldQuantity: q1.$inc.soldQuantity, quantity: q2.$inc.quantity}}
        //             } else {
        //                 finalQuery = {...q1, ...q2};
        //             }
        //
        //             // Update Product Data
        //             Product.updateOne({_id: m._id},
        //                 finalQuery,
        //                 {new: true, upsert: true, multi: true}).exec()
        //         });
        //     }
        //
        // }

        res.json({
            message: "Order status updated",
        })
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.filterByDynamicFilters = async (req, res, next) => {

    try {
        let limit = req.body.limit;
        const deliveryStatus = req.query.deliveryStatus;

        // const parent = req.body.parent;
        const queryData = await Order.find({ deliveryStatus: deliveryStatus })

        if (limit && limit.pageSize && limit.currentPage) {
            queryData.skip(limit.pageSize * (limit.currentPage - 1)).limit(limit.pageSize)
        }

        const dataCount = await Order.countDocuments({ deliveryStatus: deliveryStatus });

        const data = await queryData;

        res.status(200).json({
            data: data,
            count: dataCount
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.filterByDateRange = async (req, res, next) => {

    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const queryData = await Order.find({ checkoutDate: { "$gte": startDate, "$lte": endDate } })

        if (limit && limit.pageSize && limit.currentPage) {
            queryData.skip(limit.pageSize * (limit.currentPage - 1)).limit(limit.pageSize)
        }

        const dataCount = await Order.countDocuments({ deliveryStatus: query });

        const data = await queryData;

        res.status(200).json({
            data: data,
            count: dataCount
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.testSslSmsApi = (req, res, next) => {

    const smsData = {
        user: process.env.SMSUSER,
        pass: process.env.SMSPASS,
        msisdn: '8801773253900',
        sms: 'A test message from nodejs',
        sid: process.env.SMSSID,
        csmsid: '014578874512577895'
    }
    // GET
    // const apiEnd = "https://sms.sslwireless.com/pushapi/dynamic/server.php";
    // ax.get(apiEnd, {
    //     params: smsData
    // }).then(function (response) {
    //         console.log("response:");
    //         console.log(response.data);
    //         res.status(200).json({
    //             success: true,
    //         });
    //     })
    //     .catch(function (error) {
    //         console.log("error:");
    //         res.status(200).json({
    //             success: false,
    //         });
    //         console.log(error);
    //     });

    var apiEnd = 'https://sms.sslwireless.com/pushapi/dynamic/server.php';
    let payload = "user=" + encodeURI(smsData.user) + "&pass=" + encodeURI(smsData.pass) + "&sid=" +
        encodeURI(smsData.sid) + "&sms[0][0]=" + smsData.msisdn + "&sms[0][1]=" + encodeURI(smsData.sms) + "&sms[0][2]=" + smsData.csmsid + "";
    ax.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    ax.post(apiEnd, payload)
        .then(function (response) {
            console.log("response::");
            // console.log(response.data);
            res.status(200).json({
                success: true,
            });
        })
        .catch(function (error) {
            console.log("error::");
            // console.log(error);
            res.status(200).json({
                success: false,
            });
        });


}
exports.getMultipleOrderById = async(req,res,next)=>{
    try {
        //console.log('--------------------------[974]------------------------------')
        const ids=req.body;
        //console.log(ids)
        const query = {_id: {$in: ids}}
        const data = await Order.find(query)
        .populate(
            {
                path: 'orderedItems.product',
                model: 'Product',
                select: 'productName productSlug price category categorySlug subCategory subCategorySlug brand brandSlug images'
            }
        )
        .sort({ createdAt: -1 });
       // console.log(data);
        res.status(200).json({
            data:data,
            count:data.length,
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}
/**
 * ADDITIONAL FUNCTIONS
 */
function padLeadingZeros(num) {
    return String(num).padStart(4, '0');
}

function incrementSoldQuantityQuery(item) {
    let query;
    if (item.productSoldQty) {
        query = {
            $inc: {
                soldQuantity: item.soldQuantity ? item.soldQuantity : 1
            }
        };
    } else {
        query = {
            $set: {
                soldQuantity: item.soldQuantity ? item.soldQuantity : 1
            }
        };
    }
    return query;
}

function decrementQuantityQuery(item) {
    let query;
    if (item.productQty) {
        query = {
            $inc: {
                quantity: -(item.soldQuantity ? item.soldQuantity : 1)
            }
        };
    } else {
        query = {
            $set: {
                quantity: -(item.soldQuantity ? item.soldQuantity : 1)
            }
        };
    }

    return query;
}
