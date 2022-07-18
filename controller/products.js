// Require Post Schema from Model
const Product = require('../models/products');

exports.addProduct = async (req, res, next) => {

    try {
        const data = req.body;
        console.log("data: ", data);
        const product = new Product(data);
        await product.save();

        res.status(200).json({
            success: true,
            message: 'product Added Successfully!'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            console.log(err);
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getAllProducts = async (req, res, next) => {
    try {
        const Products = await Product.find();
        const docCount = await Product.countDocuments();

        res.status(200).json({
            success: true,
            data: Products,
            count: docCount
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.getProductByProductId = async (req, res, next) => {
    try {
        const id = req.params.id;
        console.log("ID : ",id);
        const data = await Product.findOne({_id: id});
        console.log(data)
        res.status(200).json({
            success: true,
            data: data,
            
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


exports.editProductData = async (req, res, next) => {

    try {
        const updatedData = req.body;
        await Product.updateOne({_id: updatedData._id}, {$set: updatedData});

        res.status(200).json({
            success: true,
            message: 'Product Updated Successfully!'
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

exports.deleteProductByProductId = async (req, res, next) => {

    try {

        const id = req.params.id;
        console.log(id);
        await Product.deleteOne({_id: id});

        res.status(200).json({
            success: true,
            message: 'Product Deleted Successfully',
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            err.message = 'Something went wrong on database operation!'
        }
        next(err);
    }
}

exports.productsList = async (req, res, next) => {
    try {
        let paginate = req.body.paginate;
        let filter = req.body.filter;

        let queryData;
        let dataCount;

        let priceRange = {
            minPrice: 0,
            maxPrice: 0
        }
        let minPrice;
        let maxPrice;

        let type = 'default';
        let i = -1;

        if (filter) {

            if ('categorySlug' in filter) {
                type = 'cat';
                i = index;
            }
            ;
            if ('subCategorySlug' in filter) {
                type = 'subCat';
                i = index;
            }
            ;
            if ('tags' in filter) {
                type = 'tag';
                i = index;
            }
            ;

            if (type == 'cat') {
                minPrice = Product.find(filter[i]).sort({price: 1}).limit(1);
                maxPrice = Product.find(filter[i]).sort({price: -1}).limit(1);
            } else if (type == 'subCat') {
                minPrice = Product.find(filter[i]).sort({price: 1}).limit(1);
                maxPrice = Product.find(filter[i]).sort({price: -1}).limit(1);
            } else if (type == 'tag') {
                minPrice = Product.find(filter[i]).sort({price: 1}).limit(1);
                maxPrice = Product.find(filter[i]).sort({price: -1}).limit(1);
            } else {
                minPrice = Product.find().sort({price: 1}).limit(1);
                maxPrice = Product.find().sort({price: -1}).limit(1);
            }
        } else {
            minPrice = Product.find().sort({price: 1}).limit(1);
            maxPrice = Product.find().sort({price: -1}).limit(1);
        }

        const temp1 = await minPrice;
        const temp2 = await maxPrice;

        priceRange.minPrice = temp1.length > 0 ? temp1[0].price : 0;
        priceRange.maxPrice = temp2.length > 0 ? temp2[0].price : 0;

        if (filter) {
            queryData = Product.find(filter);
        } else {
            queryData = Product.find();
        }

        if (paginate) {
            queryData.skip(Number(paginate.pageSize) * (Number(paginate.currentPage) - 1)).limit(Number(paginate.pageSize))
        }

        const data = await queryData
            // .populate('-shortDescription -description')
            .populate('attributes')
            .populate('brand')
            .populate('category')
            .populate('subCategory')
            .populate('tags')
            .select('productName images productSlug price discountType ratingReview discountAmount category brandSlug categorySlug brand sku subCategorySlug tags quantity campaignStartDate campaignEndDate campaignStartTime campaignEndTime')
            .sort({createdAt: -1})

        if (filter) {
            dataCount = await Product.countDocuments(filter);
        } else {
            dataCount = await Product.countDocuments();
        }

        // Check Campaign
        if (data && data.length) {
            data.forEach(m => {
                // Check Discount with Campaign
                if (m.campaignStartDate && m.campaignEndDate) {
                    const startDateTime = utils.convertToDateTime(m.campaignStartDate, m.campaignStartTime);
                    const endDateTime = utils.convertToDateTime(m.campaignEndDate, m.campaignEndTime);

                    const startTimeFromNow = utils.getDateTimeDifference(startDateTime);
                    const endTimeFromNow = utils.getDateTimeDifference(endDateTime);

                    // startTimeFromNow > 0 ---> Not Start Yet ** Discount will be 0 **
                    // startTimeFromNow < 0 ---> Already Started ** Discount will live **
                    // endTimeFromNow > 0 ---> Running ** Discount will live **
                    // endTimeFromNow < 0 ---> Expired ** Discount will be 0 **

                    if (startTimeFromNow > 0 || endTimeFromNow <= 0) {
                        m.discountType = null;
                        m.discountAmount = 0;
                    }
                }
            })
        }
        res.status(200).json({
            data: data,
            priceRange: priceRange,
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




exports.getSpecificProductsByIds = async (req, res, next) => {

    try {

        const dataIds = req.body.ids;
        const query = {_id: {$in: dataIds}}
        const data = await Product.find(query)
            
            

        // Discount Check with Campaign

        res.status(200).json({
            data: data ? data : []
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

exports.getSpecificProductsById = async (req, res, next) => {

    try {

        const dataIds = req.body.productId;
        const query = {_id: {$in: dataIds}}
        const data = await Product.find(query).populate('extraData');
        // .select('_id name slug image price discountPercent availableQuantity author authorName');

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