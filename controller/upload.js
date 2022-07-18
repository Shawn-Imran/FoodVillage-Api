const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
// const AvatarStorage = require('../helpers/AvatarStorage');

/**
 * SINGLE TO MULTI SIZE IMAGE
 */
// const storageSingleToMulti = AvatarStorage({
//     square: false,
//     responsive: true,
//     greyscale: false,
//     quality: 100,
//     output: 'jpg'
// });

const limitsSingleToMulti = {
    files: 1, // allow only 1 file per request
    // fileSize: 5000000
    fileSize: 10240 * 10240, // 10 MB (max file size)
};

const fileFilter = function (req, file, cb) {
// supported image file mimetypes
    const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp'];

    if (_.includes(allowedMimes, file.mimetype)) {
// allow supported image files
        cb(null, true);
    } else {
// throw error for invalid files
        cb(new Error('Invalid file type. your image files are not allowed.'));
    }
};

// exports.multerConfigSingleToMulti = multer({
//     storage: storageSingleToMulti,
//     limits: limitsSingleToMulti,
//     fileFilter: fileFilter
// });

exports.uploaderImageSingleToMulti = (req, res, next) => {

    let files;
    const file = req.file.filename;
    const matches = file.match(/^(.+?)_.+?\.(.+)$/i);

    if (matches) {
        files = _.map(['lg', 'md', 'sm'], function (size) {
            return matches[1] + '_' + size + '.' + matches[2];
        });
    } else {
        files = [file];
    }


    files = _.map(files, function (file) {
        // const port = req.get('port');
        // const baseurl = req.protocol + '://' + req.get("host");
        const baseurl = req.protocol + 's://' + req.get("host");
        // const path = req.file.path.split('\\').join('/');
        // console.log(baseurl)
        // const base = req.protocol + '://' + req.hostname + (port ? ':' + port : '');
        const url = path.join(req.file.baseUrl, file).replace(/[\\\/]+/g, '/').replace(/^[\/]+/g, '');
        return (req.file.storage == 'local' ? baseurl : '') + '/' + url;
    });

    res.status(200).json({
        images: {
            big: files[0],
            medium: files[1],
            small: files[2]
        }
    });

};


/**
 * UPLOAD ORIGINAL SINGLE IMAGE
 */

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Destination Folder Dynamic..
        const {folderPath} = req.body;
        const dir = `./uploads/${folderPath === undefined ? process.env.UPLOAD_DEFAULT_DIR : folderPath}`


        // Check Folder Exists or not
        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, err => cb(err, dir))
            }
            return cb(null, dir);
        })

    },
    filename: (req, file, cb) => {
        const nameWithoutExt = path.parse(file.originalname).name;
        const name = nameWithoutExt.toLowerCase().split(' ').join('-') + '-' + Date.now().toString().slice(-4) + path.extname(file.originalname)
        cb(null, name);
    }
});

function checkFileType(file, cb) {
    // Allowed Ext..
    const fileTypes = /jpeg|jpg|png|webp|svg|gif/;
    // Check Extension..
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    // Check MimeTypes..
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error! Image Only!');
    }

}

exports.multerConfigSingleImageOriginal = multer({
    storage: fileStorage,
    limits: {fileSize: 5000000},
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb)
    }
})


exports.uploaderImageOriginal = (req, res, next) => {
    if (req.file == undefined) {
        res.status(404).json({
            message: 'No Image Provided'
        });
        return;
    }
    // Base Url..
    // const baseurl = req.protocol + '://' + req.get("host");
    const baseurl = req.protocol + 's://' + req.get("host");
    const path = req.file.path.split('\\').join('/');
    // const realPath = path.split('\\').join('/');
    const downloadUrl = `${baseurl}/${path}`;
    res.status(200).json({
        message: 'Success',
        downloadUrl: downloadUrl
    });

};


/**
 * UPLOAD MULTIPLE IMAGE
 */
exports.uploaderImageMulti = (req, res, next) => {
    // const files = req.file;
    const files = req.files;
    const downloadUrls = [];
    const baseurl = req.protocol + '://' + req.get("host");
    // const baseurl = req.protocol + 's://' + req.get("host");

    if (files.length > 0) {
        files.forEach(file => {
            const path = file.path.split('\\').join('/');
            downloadUrls.push(`${baseurl}/${path}`);
        })

        res.status(200).json({
            message: 'Success',
            downloadUrls: downloadUrls
        });
    }

};


/**
 * UPLOAD FILE
 */

const fileStorageForPDF = multer.diskStorage({
    destination: (req, file, cb) => {
        // Destination Folder Dynamic..
        const dir = './uploads/pdf'

        // Check Folder Exists or not
        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, err => cb(err, dir))
            }
            return cb(null, dir);
        })

    },
    filename: (req, file, cb) => {
        const name = file.fieldname.toLowerCase().split(' ').join('-') + Date.now() + path.extname(file.originalname)
        cb(null, name);
    }
});

function checkPdfFileType(file, cb) {
    // Allowed Ext..
    const fileTypes = /pdf/;
    // Check Extension..
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    // Check MimeTypes..
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error! PDF Only!');
    }

}


exports.multerConfigPdf = multer({
    storage: fileStorageForPDF,
    limits: {fileSize: 500000},
    fileFilter: function (req, file, cb) {
        checkPdfFileType(file, cb)
    }
})


exports.uploaderPdf = (req, res, next) => {
    if (req.file === undefined) {
        const error = new Error('No Pdf File provide');
        next(error)
        // res.status(404).json({
        //     message: 'No PDF Provided'
        // });
        return;
    }
    // Base Url..
    const baseurl = req.protocol + '://' + req.get("host");
    const path = req.file.path.split('\\').join('/');
    // const realPath = path.split('\\').join('/');
    const downloadUrl = `${baseurl}/${path}`;
    res.status(200).json({
        message: 'Success',
        pdfUrl: downloadUrl
    });

};

/**
 * REMOVE IMAGE
 */

exports.removeFileFromArray = (req, res, next) => {
    // const baseurl = req.protocol + '://' + req.get("host");
    const baseurl = req.protocol + 's://' + req.get("host");
    const data = req.body.data;

    if (data instanceof Array) {
        const imagesPath = data;
        const success = [];
        imagesPath.forEach(img => {
            const path = `.${img.replace(baseurl, '')}`;

            if (path) {
                try {
                    fs.unlinkSync(path);
                    success.push('done')
                    if (imagesPath.length === success.length) {
                        res.status(200).json({
                            message: 'Success! Images Successfully Removed.'
                        });
                    }
                } catch(err) {
                    res.status(401).json({
                        message: 'Error! No file Directory OR Something went wrong.'
                    });
                }
            }
            // console.log(img)
        })
    } else {
        res.status(401).json({
            message: 'Error! Must Provide array of string'
        });
    }
}

exports.removeFileMulti = (req, res, next) => {
    // const baseurl = req.protocol + '://' + req.get("host");
    const baseurl = req.protocol + 's://' + req.get("host");
    const data = req.body;


    if (data instanceof Array) {
        const imagesPath = [];
        const success = [];
        data.map(m => {
            Object.keys(m).forEach(key => imagesPath.push(m[key]));
        })
        imagesPath.forEach(img => {
            const path = `.${img.replace(baseurl, '')}`;

            if (path !== null) {
                try {
                    fs.unlinkSync(path);
                    success.push('done')
                    if (imagesPath.length === success.length) {
                        res.status(200).json({
                            message: 'Success! Image Successfully Removed.'
                        });
                    }
                } catch(err) {
                    res.status(401).json({
                        message: 'Error! No file Directory OR Something went wrong.'
                    });
                }
            }
            // console.log(img)
        })
    } else {
        if (typeof data === 'object') {
            const imagesPath = [];
            const success = [];
            Object.keys(data).forEach(key => imagesPath.push(data[key]));

            imagesPath.forEach(img => {
                const path = `.${img.replace(baseurl, '')}`;

                if (path !== null) {
                    try {
                        fs.unlinkSync(path);
                        success.push('done')
                        if (imagesPath.length === success.length) {
                            res.status(200).json({
                                message: 'Success! Image Successfully Removed.'
                            });
                        }
                    } catch(err) {
                        res.status(401).json({
                            message: 'Error! No file Directory OR Something went wrong.'
                        });
                    }
                }

            })
        }
    }

}


exports.removeSingleFile = (req, res, next) => {
    // const baseurl = req.protocol + '://' + req.get("host");
    const baseurl = req.protocol + 's://' + req.get("host");
    const { url } = req.body;
    const path = `.${url.replace(baseurl, '')}`;
    // console.log(baseurlHttps);

    if (path !== null) {
        try {
            fs.unlinkSync(path);
            res.status(200).json({
                message: 'Success! Image Successfully Removed.'
            });
        } catch(err) {
            res.status(401).json({
                message: 'Error! No file Directory OR Something went wrong.'
            });
        }
    }

};
