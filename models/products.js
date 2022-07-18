const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    productSlug: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: false
    }],
    size: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: false
    },
    
}, {
    timestamps: true,
    versionKey: false
});


module.exports = mongoose.model('Product', schema);