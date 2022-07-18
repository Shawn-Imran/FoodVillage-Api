const mongoose = require('mongoose');
const Schema = mongoose.Schema;


exports.orderItem = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        discountType: {
            type: Number,
            required: false
        },
        discountAmount: {
            type: Number,
            required: false
        },
        quantity: {
            type: Number,
            required: true
        },
        orderType: {
            type: String,
            required: true
        }
    },
    {
        _id: true
    }
);

exports.discussionReply = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        replyDate: {
            type: Date,
            required: false
        },
        profileImage: {
            type: String,
            required: false
        },
        isAdmin: {
            type: Boolean,
            required: false
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: false
        },
        comment: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            required: true
        },
        vote: {
            type: Number,
            required: false
        },
        reply: {
            type: [Object],
            required: false
        },
    },
    {
        _id: true
    }
);
