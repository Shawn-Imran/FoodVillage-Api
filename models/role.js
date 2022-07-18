const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    readOnly: {
        type: Boolean,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: false
    },
    access: {
        type: [Object],
        required: true
    },
}, {
    timestamps: true,
    versionKey: false
});


module.exports = mongoose.model('Role', schema);
