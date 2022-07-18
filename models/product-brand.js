const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
    readOnly: {
        type: Boolean,
        required: false
    },
    brandName: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: false
    },
    brandSlug: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('ProductBrand', schema);
