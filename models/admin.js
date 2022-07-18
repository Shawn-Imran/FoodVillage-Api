const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    readOnly: {
        type: Boolean,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    profileImg: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: true
    },
    hasAccess: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Admin', schema);
