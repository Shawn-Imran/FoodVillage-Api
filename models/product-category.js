const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
    readOnly: {
        type: Boolean,
        required: false
    },
    categoryName: {
        type: String,
        required: true
    },
    categorySlug: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    description:{
        type: String,
        required: false
    },
    attributes: [{
        type: Schema.Types.ObjectId,
        ref: 'ProductAttribute'
    }]
}, {
    timestamps: true
});


module.exports = mongoose.model('ProductCategory', schema);
