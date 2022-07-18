const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema(
    {
        
        first_name: {
            type: String,
            required: false
        },
        last_name: {
            type: String,
            required: false
        },
        birthday: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        },
        password: {
            type: String,
            required: false
        },
        confirm_password: {
            type: String,
            required: false
        },
        
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model('User', userSchema);
