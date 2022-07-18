const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
    cashOnDelivery: {
        type: Boolean,
        required: false
    },
    onlinePayment: {
        type: Boolean,
        required: false
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Setting', schema);