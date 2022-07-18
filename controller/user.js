// Require Main Modules..
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Require Post Schema from Model..
const User = require('../models/user');


/**
 * User Registration
 * User Login
 */



 exports.userRegistrationDefault = async (req, res, next) => {

    const errors = validationResult(req);
    // Check Input validation Error with Error Handler..
    if (!errors.isEmpty()) {
        const error = new Error('Input Validation Error! Please complete required information.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error)
        return;
    }


    try {
        const bodyData = req.body;
        let query;
        let token;

        
        query = {email: bodyData.email}
        

        const userExists = await User.findOne(query).lean();

        if (userExists) {
            res.status(200).json({
                message: `A user with this ${bodyData.phoneNo ? 'Phone' : 'Email'} no already registered!`,
                success: false
            });
        } else {
            const password = bodyData.password;
            const hashedPass = bcrypt.hashSync(password, 8);
            const registrationData = {...bodyData, ...{password: hashedPass}}
            const user = new User(registrationData);

            const newUser = await user.save();

            token = jwt.sign({
                    username: newUser.username,
                    userId: newUser._id
                },
                process.env.JWT_PRIVATE_KEY, {
                    expiresIn: '7d'
                }
            );

            res.status(200).json({
                message: 'Login Success',
                success: true,
                token: token,
                expiredIn: 604800
            })
        }

    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }



    // const bodyData = req.body;
    //     let query;
    //     let token;

    // // let user = new User(userData);
    // const userExists = await User.findOne(query).lean();

    // user.save((error, registerUser) => {
    //     if (error) {
    //         console.log(error);
    //     }
    //     else {
    //         // let payload = {subject: registerUser._id}
    //         // let token = jwt.sign(payload, 'secretKey')
    //         // res.status(200).send({token});
    //         res.status(200).send(registerUser);
    //     }
    // })
    

}



exports.userLoginDefault = async (req, res) => {
    
    
    try {
        const email = req.body.email;
        const password = req.body.password;

        let loadedUser;
        let token;
        const user = await User.findOne({email: email})

        if (!user) {
            res.status(200).json({
                message: 'A User with this phone or email no could not be found!',
                success: false
            });
        } else if (user.hasAccess === false) {
            res.status(200).json({
                message: 'Ban! Your account has been banned',
                success: false
            });
        } else {
            loadedUser = user;
            const isEqual = await bcrypt.compareSync(password, user.password);
            if (!isEqual) {
                res.status(200).json({
                    message: 'You entered a wrong password!',
                    success: false
                });
            } else {
                token = jwt.sign({
                        username: loadedUser.username,
                        userId: loadedUser._id
                    },
                    process.env.JWT_PRIVATE_KEY, {
                        expiresIn: '7d'
                    }
                );
                res.status(200).json({
                    success: true,
                    message: 'Welcome back. Login Success',
                    token: token,
                    expiredIn: 604800
                })
            }

        }

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
    
    
    
    
    // let userData = req.body;
    // User.findOne({email: userData.email}, (error, user) => {
    //     if (error) {
    //         console.log(error);
    //     }
    //     else {
    //         if (!user){
    //             res.status(404).send('Invalid email')
    //         }
    //         else if (user.password !== userData.password){
    //             res.status(404).send('Invalid pass')
    //         }
    //         else{
    //             res.status(200).send(user)
    //         }
    //     }
    // })
}





// exports.userRegistrationDefault = async (req, res, next) => {
//     const errors = validationResult(req);
//     // Check Input validation Error with Error Handler..
//     if (!errors.isEmpty()) {
//         const error = new Error('Input Validation Error! Please complete required information.');
//         error.statusCode = 422;
//         error.data = errors.array();
//         next(error)
//         return;
//     }
    
//     try {
//         const bodyData = req.body;
//         const query = {username: bodyData.phoneNo}

//         let token;

//         const userExists = await User.findOne(query).lean();

//         if (userExists) {
//             token = jwt.sign({
//                     username: userExists.username,
//                     userId: userExists._id
//                 },
//                 process.env.JWT_PRIVATE_KEY, {
//                     expiresIn: '90d'
//                 }
//             );

//             res.status(200).json({
//                 message: 'Welcome! Login Success',
//                 success: true,
//                 token: token,
//                 expiredIn: 7776000000
//             })

//         } else {
//             const user = new User(bodyData);
//             const newUser = await user.save();

//             token = jwt.sign({
//                     username: newUser.username,
//                     userId: newUser._id
//                 },
//                 process.env.JWT_PRIVATE_KEY, {
//                     expiresIn: '90d'
//                 }
//             );

//             res.status(200).json({
//                 message: 'Registration Success.',
//                 success: true,
//                 token: token,
//                 expiredIn: 7776000000
//             })
//         }

//     } catch (err) {
//         console.log(err)
//         if (!err.statusCode) {
//             err.statusCode = 500;
//             err.message = 'Something went wrong on database operation!'
//         }
//         next(err);
//     }

// }


// Login User..
// exports.userLoginDefault = async (req, res, next) => {

//     try {
//         const email = req.body.email;
//         const password = req.body.password;

//         let loadedUser;
//         let token;
//         const user = await User.findOne({email: email})

//         if (!user) {
//             res.status(200).json({
//                 message: 'A User with this phone or email no could not be found!',
//                 success: false
//             });
//         } else if (user.hasAccess === false) {
//             res.status(200).json({
//                 message: 'Ban! Your account has been banned',
//                 success: false
//             });
//         } else {
//             loadedUser = user;
//             const isEqual = await bcrypt.compareSync(password, user.password);
//             if (!isEqual) {
//                 res.status(200).json({
//                     message: 'You entered a wrong password!',
//                     success: false
//                 });
//             } else {
//                 token = jwt.sign({
//                     email: loadedUser.email,
//                         userId: loadedUser._id
//                     },
//                     process.env.JWT_PRIVATE_KEY, {
//                         expiresIn: '90d'
//                     }
//                 );
//                 res.status(200).json({
//                     success: true,
//                     message: 'Welcome back. Login Success',
//                     token: token,
//                     expiredIn: 7776000000
//                 })
//             }

//         }

//     } catch (err) {
//         if (!err.statusCode) {
//             err.statusCode = 500;
//             err.message = 'Something went wrong on database operation!'
//         }
//         next(err);
//     }

// }

exports.getLoginUserInfo = async (req, res, next) => {
    try {
        const loginUserId = req.userData.userId;
        const selectString = req.query.select;

        let user;

        if (selectString) {
            user = User.findById(loginUserId).select(selectString)
        } else {
            user = User.findById(loginUserId).select('-password')
        }
        const data = await user;

        res.status(200).json({
            data: data,
            message: 'Successfully Get user info.'
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.editLoginUserInfo = async (req, res, next) => {
    try {
        const loginUserId = req.userData.userId;
        await User.findOneAndUpdate(
            {_id: loginUserId},
            {$set: req.body}
        );

        res.status(200).json({
            message: 'Successfully Updated user info.'
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.checkUserByPhone = async (req, res, next) => {

    const phoneNo = req.params.phoneNo;

    try {

        if (await User.findOne({email: email})) {
            res.status(200).json({
                data: true,
                message: 'Check Your Phone & Enter OTP Below!'
            });
        } else {
            res.status(200).json({
                data: false,
                message: 'No Account Exists With This Phone Number!'
            });
        }

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


/**
 * USER CONTROL BY ADMIN
 */
exports.getUserLists = async (req, res, next) => {
    try {

        const ipAddress = req.connection.remoteAddress.replace(/\//g, '.')
        console.log('IP', ipAddress)

        const paginate = req.body.paginate;
        const filter = req.body.filter;

        const select = req.query.select;
        let query;

        if (filter) {
            query = User.find(filter);
        } else {
            query = User.find();
        }

        if (paginate) {
            query.skip(Number(paginate.pageSize) * (Number(paginate.currentPage) - 1)).limit(Number(paginate.pageSize))
        }

        const count = await User.countDocuments(filter ? filter : {});
        const data = await query.sort({createdAt: -1}).select(select ? select : '');


        res.status(200).json({
            count: count,
            data: data
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getUserByUserId = async (req, res, next) => {

    try {

        const userId = req.params.userId;
        const user = await User.findOne({_id: userId})

        res.status(200).json({
            data: user,

        });
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}









