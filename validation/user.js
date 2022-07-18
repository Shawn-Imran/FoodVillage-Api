const { body } = require('express-validator');

// For User Registration..
exports.checkUserRegInput = [
    body('fullName').trim().not().isEmpty().withMessage('Name required!'),
    body('phoneNo').trim().not().isEmpty().withMessage('Please enter a valid phone no!'),
    body('password').isLength({min: 5}).withMessage('Password must be longer than 5 character!')
];

exports.checkPhoneVerificationInput = [
    body('userId').not().isEmpty().withMessage('User Id required!'),
    body('isPhoneVerified').not().isEmpty().withMessage('Phone Verified data required!'),
]
