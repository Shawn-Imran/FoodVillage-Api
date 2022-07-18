const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
        orderId: {
            type: Number,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

module.exports = mongoose.model('UniqueId', schema);
