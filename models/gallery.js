const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        folder: {
            type: Schema.Types.ObjectId,
            ref: 'ImageFolder',
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)
module.exports = mongoose.model('Gallery', schema);
