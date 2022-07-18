
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema(
    {
        couponName: {
            type: String,
            required: true
        },
        couponCode: {
            type: String,
            required: true,
            unique: true
        },
        couponAmount: {
            type: Number,
            required: true
        },
        couponType: {
            type: Number,
            required: true
        },
        couponDiscountType: {
            type: Number,
            required: true
        },
        couponLimit: {
            type: Number,
            required: false
        },
        couponMinPurchase: {
            type: Number,
            required: true
        },
        couponStartDate: {
            type: String,
            required: true
        },
        couponEndDate: {
            type: String,
            required: true
        },
        couponUsedByUser: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        }],
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Coupon', schema);
