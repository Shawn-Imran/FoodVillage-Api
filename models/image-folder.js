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
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

module.exports = mongoose.model('ImageFolder', schema);
