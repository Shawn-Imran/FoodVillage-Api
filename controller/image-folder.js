const {validationResult} = require('express-validator');

// Require Post Schema from Model..
const ImageFolder = require('../models/image-folder');

/**
 * Add ImageFolder
 * Get ImageFolder List
 */

exports.addNewImageFolder = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Input Validation Error! Please complete required information.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error)
        return;
    }
    try {

        const data = req.body;
        const dataExists = await ImageFolder.findOne({slug: data.slug}).lean();

        if (dataExists) {
            const error = new Error('A folder with this name already registered!');
            error.statusCode = 406;
            next(error)
        } else {
            const dataSchema = new ImageFolder(data);
            await dataSchema.save();

            res.status(200).json({
                message: 'ImageFolder Image Added Successfully!'
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

exports.addNewImageFolderMulti = async (req, res, next) => {

    try {

        const data = req.body.data;
        await ImageFolder.insertMany(data);

        res.status(200).json({
            message: 'Multiple Images Added to ImageFolder Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.getAllImageFolder = async (req, res, next) => {
    try {

        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;

        let queryData;
        queryData = ImageFolder.find();

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        const data = await queryData.sort({createdAt: -1});
        const dataCount = await ImageFolder.countDocuments();

        res.status(200).json({
            data: data,
            count: dataCount,
            message: 'All Image fetch Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getSingleImageFolderById = async (req, res, next) => {
    const id = req.params.id;
    const query = {_id: id}

    try {
        const data = await ImageFolder.findOne(query);
        res.status(200).json({
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


exports.deleteImageFolderById = async (req, res, next) => {
    const id = req.params.id;
    const query = {_id: id}

    try {
        await ImageFolder.deleteOne(query);
        res.status(200).json({
            message: 'Image delete Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.deleteImageFolderMulti = async (req, res, next) => {
    const ids = req.body.data;

    try {
        await ImageFolder.deleteMany({_id: ids});
        res.status(200).json({
            message: 'Images delete Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.editImageFolderData = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Input Validation Error! Please complete required information.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error)
        return;
    }

    const updatedData = req.body;
    const query = {_id: updatedData._id}
    const push = {$set: updatedData}

    ImageFolder.findOneAndUpdate(query, push)
        .then(() => {
            res.status(200).json({
                message: 'Image Updated Success!'
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}


