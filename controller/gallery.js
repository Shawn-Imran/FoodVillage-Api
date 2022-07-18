const {validationResult} = require('express-validator');

// Require Post Schema from Model..
const Gallery = require('../models/gallery');

/**
 * Add Gallery
 * Get Gallery List
 */

exports.addNewGalleryImage = async (req, res, next) => {
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
        const dataSchema = new Gallery(data);
        await dataSchema.save();

        res.status(200).json({
            message: 'Gallery Image Added Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.addNewGalleryMultiImage = async (req, res, next) => {

    try {

        const data = req.body.data;
        await Gallery.insertMany(data);

        res.status(200).json({
            message: 'Multiple Images Added to Gallery Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}


exports.getAllGalleryImage = async (req, res, next) => {
    try {

        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;
        let folder = req.query.folder;

        let queryData;
        let dataCount;

        if (folder) {
            queryData = Gallery.find({folder: folder})
                .populate('folder');
        } else {
            queryData = Gallery.find()
                .populate('folder');
        }

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        if (folder) {
            dataCount = await Gallery.countDocuments({folder: folder});
        } else {
            dataCount = await Gallery.countDocuments();
        }
        const data = await queryData.sort({createdAt: -1});

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

exports.getSingleGalleryImageById = async (req, res, next) => {
    const id = req.params.id;
    const query = {_id: id}

    try {
        const data = await Gallery.findOne(query)
            .populate('folder');
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


exports.deleteGalleryImageById = async (req, res, next) => {
    const id = req.params.id;
    const query = {_id: id}

    try {
        await Gallery.deleteOne(query);
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

exports.deleteGalleryImageMulti = async (req, res, next) => {
    const ids = req.body.data;

    try {
        await Gallery.deleteMany({_id: ids});
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

exports.editGalleryImageData = (req, res, next) => {
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

    Gallery.findOneAndUpdate(query, push)
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


/**
 * SEARCH IMAGE
 */

exports.getSearchImageByRegex = async (req, res, next) => {
    try {

        // Query
        const query = req.query.q;

        // Pagination
        let pageSize = req.query.pageSize;
        let currentPage = req.query.page;

        // SPLIT STRING AND REGEX
        const newQuery = query.split(/[ ,]+/);
        const queryArray = newQuery.map((str) => ({name: RegExp(str, 'i')}));

        const queryData = Gallery.find({$and: queryArray})

        if (pageSize && currentPage) {
            queryData.skip(Number(pageSize) * (Number(currentPage) - 1)).limit(Number(pageSize))
        }

        const results = await queryData.sort({createdAt: -1});
        const dataCount = await Gallery.countDocuments({$and: queryArray});

        res.status(200).json({
            data: results,
            count: dataCount
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

