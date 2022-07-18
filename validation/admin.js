const { body } = require('express-validator');

// For Admin..
exports.checkAdminRegInput = [
    body('username').not().isEmpty().withMessage('username is required!'),
    body('password').trim().isLength({min: 5}).withMessage('Oops! Password must be longer.'),
];

exports.checkAdminLoginInput = [
    body('username').not().isEmpty().withMessage('Please enter a valid username!'),
    body('password').trim().isLength({min: 5}).withMessage('Oops! Password must be longer.')
];
