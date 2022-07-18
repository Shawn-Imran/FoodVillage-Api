const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
    readOnly: {
        type: Boolean,
        required: false
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'ProductCategory'
    },
    subCategoryName: {
        type: String,
        required: true
    },
    subCategorySlug: {
        type: String,
        required: true
    },
    attributes: [{
        type: Schema.Types.ObjectId,
        ref: 'ProductAttribute'
    }],
    // tags: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Tag'
    // }]
}, {
    timestamps: true
});


module.exports = mongoose.model('ProductSubCategory', schema);
