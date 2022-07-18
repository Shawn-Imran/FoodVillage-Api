exports.next = ((error, req, res, next) => {
    // console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(status).json({
        message: message,
        statusCode: status,
        errorData: data
    });
});

exports.route = ((req, res, next) => {
    const err = new Error('No routes found!')
    err.statusCode = 404;
    next(err)
})
