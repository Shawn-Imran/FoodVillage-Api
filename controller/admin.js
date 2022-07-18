// Require Main Modules..
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Require Post Schema from Model..
const Admin = require('../models/admin');
const Role = require('../models/role');
const ProductBrand = require('../models/product-brand');
// const ProductParentCategory = require('../models/product-parent-category');
const ProductCategory = require('../models/product-category');
const ProductSubCategory = require('../models/product-sub-category');
const ImageFolder = require('../models/image-folder');
const User = require("../models/user");


/**
 * Admin Registration
 * Admin Login
 */

exports.insertDefaultDocuments = async (req, res, next) => {

    try {

        const data = req.body;

        const admin = data.admin;
        const brand = data.brand;
        const category = data.category;
        const subCategory = data.subCategory;
        const role = data.role;
        const image_folder = data.imageFolder;

        const newRole = new Role(role);
        const resultRole = await newRole.save();

        admin.role = resultRole._id;
        const hashedPass = bcrypt.hashSync(admin.password, 8);
        admin.password = hashedPass;
        const newAdmin = new Admin(admin);
        await newAdmin.save();

        const newBrand = new ProductBrand(brand);
        await newBrand.save();

        // const newParentCategory = new ProductParentCategory(parentCategory);
        // const resultParentCategory = await newParentCategory.save();

        // category.parentCategory = resultParentCategory._id;
        const newCategory = new ProductCategory(category);
        const resultCategory = await newCategory.save();

        // subCategory.parentCategory = resultParentCategory._id;
        subCategory.category = resultCategory._id;
        const newSubCategory = new ProductSubCategory(subCategory);
        await newSubCategory.save();

        const imageFolder = new ImageFolder(image_folder);
        await imageFolder.save();

        res.status(200).json({
            message: 'Data deleted Successfully!'
        });

    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.adminSignUp = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Input Validation Error! Please complete required information.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error)
        return;
    }

    try {
        const bodyData = req.body;

        delete bodyData.confirmPassword;

        const password = bodyData.password;
        const hashedPass = bcrypt.hashSync(password, 8);

        // const user = new Admin({...bodyData, ...{password: hashedPass}});
        const user = new Admin({...bodyData, ...{password: hashedPass}});


        const usernameExists = await Admin.findOne({username: bodyData.username}).lean();

        if (usernameExists) {
            res.status(200).json({
                message: 'A admin with this username already registered!',
                success: false
            });
        } else {
            const emailExists = await Admin.findOne({email: bodyData.email}).lean();
            if (emailExists) {
                res.status(200).json({
                    message: 'A admin with this phone number already registered!',
                    success: false
                });
            } else {
                const newUser = await user.save();
                res.status(200).json({
                    success: true,
                    message: 'Admin Registration Success!',
                    userId: newUser._id
                });
            }
        }

    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

// Login Admin..
exports.adminLogin = async (req, res, next) => {

    const username = req.body.username;
    const password = req.body.password;

    let loadedAdmin;
    let token;

    try {

        const admin = await Admin.findOne({username: username});

        if (!admin) {
            res.status(200).json({
                message: 'A Admin with this username could not be found!',
                success: false
            });
        } else if(admin.hasAccess === false) {
            res.status(200).json({
                message: 'Permission Denied. Please contact higher authorize person.',
                success: false
            });
        } else {
            loadedAdmin = admin;
            const isEqual = bcrypt.compareSync(password, admin.password);

            if (!isEqual) {
                res.status(200).json({
                    message: 'You entered a wrong password!',
                    success: false
                });
            } else {
                // For Json Token Generate..
                token = jwt.sign({
                        username: loadedAdmin.username,
                        userId: loadedAdmin._id
                    },
                    process.env.JWT_PRIVATE_KEY_ADMIN, {
                        expiresIn: '24h'
                    }
                );

                const data = await Admin.findOne({_id: loadedAdmin._id})
                    .select('role');

                // Final Response
                res.status(200).json({
                    message: 'Login Success',
                    success: true,
                    token: token,
                    role:  data.role,
                    expiredIn: 86400
                })
            }
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        console.log(err)
        next(err);
    }
}

exports.getLoginAdminInfo = async (req, res, next) => {

    try {
        // User Shop ID from check-user-auth token..
        const loginUserId = req.adminData.userId;
        const selectString = req.query.select;

        let user;

        if (selectString) {
            user = Admin.findById(loginUserId).select(selectString)
        } else {
            user = Admin.findById(loginUserId).select('-password')
        }
        const result = await user;

        res.status(200).json({
            data: result,
            message: 'Successfully Get Admin info.'
        })
    } catch (err) {
        console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.getLoginAdminRole = async (req, res, next) => {
    try {
        // User Shop ID from check-user-auth token..
        const loginUserId = req.adminData.userId;
        const data = await Admin.findOne({_id: loginUserId})
            .select('username role');
        let mData;
        if (data) {
            mData = {
                _id: data._id,
                username: data.username,
                role: data.role
            }
        } else {
            mData = null;
        }

        res.status(200).json({
            data: mData
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}


exports.getAdminLists = async (req, res, next) => {

    try {
        const result = await Admin.find().select('-password')

        res.status(200).json({
            data: result,
            message: 'Successfully Get Admin info.'
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.getSingleAdminById = async (req, res, next) => {
    const id = req.params.id;
    try {
        const query = {_id: id};
        const data = await Admin.findOne(query)

        res.status(200).json({
            data: data,
            message: 'Data fetch Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.editAdminOwnProfileInfo = async (req, res, next) => {

    try {
        const bodyData = req.body;
        const userId = req.adminData.userId;

        await Admin.updateOne(
            {_id: userId},
            {$set: bodyData}
        )
        res.status(200).json({
            message: 'Profile info updated Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.changeAdminOwnPassword = async (req, res, next) => {

    try {
        const bodyData = req.body;
        const userId = req.adminData.userId;
        const admin = await Admin.findOne({_id: userId});

        const isEqual = bcrypt.compareSync(bodyData.oldPassword, admin.password);

        if (!isEqual) {
            const error = new Error('You entered a wrong password!');
            error.statusCode = 401;
            next(error)
        } else {
            const hashedPass = bcrypt.hashSync(bodyData.newPassword, 8);
            await Admin.updateOne(
                {_id: userId},
                {$set: {password: hashedPass}}
            )
            res.status(200).json({
                message: 'Password changed Successfully!'
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

exports.editAdmin = async (req, res, next) => {

    try {
        const bodyData = req.body;
        const userId = req.params.id;
        let finalData;
        if (bodyData.newPassword) {
            const password = bodyData.newPassword;
            const hashedPass = bcrypt.hashSync(password, 8);
            finalData = {...bodyData, ...{password: hashedPass}}
        } else {
            finalData = req.body;
            delete finalData['password']
        }

        await Admin.updateOne(
            {_id: userId},
            {$set: finalData}
        )
        res.status(200).json({
            message: 'Admin info updated Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.updateAdminImageField = async (req, res, next) => {

    try {
        const id = req.body.id;
        const query = req.body.query;

        await Admin.findOneAndUpdate({_id: id}, {
            "$set": query
        })
        res.status(200).json({
            message: 'Image Field Updated Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.deleteAdminById = async (req, res, next) => {

    const itemId = req.params.id;

    try {
        const query = {_id: itemId}
        await Admin.deleteOne(query)

        res.status(200).json({
            message: 'Data deleted Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

/**
 * ROLE
 */

exports.addAdminRole = async (req, res, next) => {
    try {
        const data = new Role(req.body);
        await data.save();

        res.status(200).json({
            message: 'Data Added Successfully!'
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


exports.getRolesData = async (req, res, next) => {

    try {
        const result = await Role.find()

        res.status(200).json({
            data: result,
            message: 'Successfully Get Data'
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}

exports.getSingleRoleById = async (req, res, next) => {

    try {
        const itemId = req.params.id;
        const query = {_id: itemId}
        const data = await Role.findOne(query)

        res.status(200).json({
            data: data,
            message: 'Data fetched Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}



exports.editAdminRole = async (req, res, next) => {

    try {
        const id = req.body._id;

        await Role.findOneAndUpdate({_id: id}, {
            "$set": req.body
        })
        res.status(200).json({
            message: 'Data edited Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.deleteAdminRoleById = async (req, res, next) => {

    try {
        const itemId = req.params.id;
        const query = {_id: itemId}
        await Role.deleteOne(query)

        res.status(200).json({
            message: 'Data deleted Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }

}



/**
 COUNTER
 **/

// exports.countsCollectionsDocuments= async (req, res, next) => {
//
//     try {
//         const courseCount = await Course.countDocuments();
//         const serviceCount = await Service.countDocuments();
//         const contactUsCount = await ContactUs.countDocuments();
//         const countsAdmin = await Admin.countDocuments();
//         const countsCourseApplication= await CourseApplication.countDocuments();
//         const countsInternApplication = await InternApplication.countDocuments();
//
//         res.status(200).json({
//             data : {
//                 courses: courseCount,
//                 services: serviceCount,
//                 contacts: contactUsCount,
//                 admins: countsAdmin,
//                 courseApplication: countsCourseApplication,
//                 internApplication: countsInternApplication,
//             }
//         });
//     } catch (err) {
//         if (!err.statusCode) {
//             err.statusCode = 500;
//             err.message = 'Something went wrong on database operation!'
//         }
//         next(err);
//     }
//
// }
