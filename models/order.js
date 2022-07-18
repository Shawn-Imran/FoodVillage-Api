const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const subSchema = require('./sub-schema-model');

const schema = new Schema(
    {
        orderId: {
            type: String,
            required: false,
            unique: true
        },
        checkoutDate: {
            type: Date,
            required: true
        },

        deliveryDate: {
            type: Date,
            required: false
        },

        deliveryStatus: {
            type: Number,
            required: true
        },

        // Amount Area
        subTotal: {
            type: Number,
            required: true
        },
        shippingFee: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            required: false
        },
        totalAmount: {
            type: Number,
            required: true
        },
        totalAmountWithDiscount: {
            type: Number,
            required: true
        },
        deletedProduct: {
            type: Boolean,
            required: false
        },
        refundAmount: {
            type: Number,
            required: false
        },
        paymentMethod: {
            type: String,
            required: true
        },

        paymentStatus: {
            type: String,
            required: true
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // User Address
        address: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
        },
        name: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: false
        },
        alternativePhoneNo: {
            type: String,
            required: false
        },
        city: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: false
        },
        shippingAddress: {
            type: String,
            required: true
        },

        // Coupon
        couponId: {
            type: Schema.Types.ObjectId,
            ref: "Coupon",
            required: false
        },
        couponValue: {
            type: Number,
            required: false
        },

        orderTimeline: {
            others: {
                type: Boolean,
                required: false
            },
            othersData: {
                type: Date,
                required: false
            },
            orderPlaced: {
                type: Boolean,
                required: false
            },
            orderPlacedDate: {
                type: Date,
                required: false
            },
            orderProcessing: {
                type: Boolean,
                required: false
            },
            orderProcessingDate: {
                type: Date,
                required: false
            },
            orderPickedByDeliveryMan: {
                type: Boolean,
                required: false
            },
            orderPickedByDeliveryManDate: {
                type: Date,
                required: false
            },
            orderDelivered: {
                type: Boolean,
                required: false
            },
            orderDeliveredDate: {
                type: Date,
                required: false
            },
        },

        // Order Type
        hasPreorderItem: {
            type: Boolean,
            required: false
        },
        orderedItems: [subSchema.orderItem],
        orderNotes: {
            type: String,
            required: false
        },
        sessionkey: {
            type: String,
            required: false
        },
        orderPaymentInfo: {
            type: Schema.Types.ObjectId,
            ref: "OrderPaymentInfo",
            required: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', schema);
