const AccessControl = require('express-ip-access-control');


// 0.0.0.0/0

const options = {
    mode: 'allow',
    denys: [],
    allows: ['0.0.0.0/0'],
    forceConnectionAddress: false,
    log: function(clientIp, access) {
        console.log(clientIp + (access ? ' accessed.' : ' denied.'));
    },

    statusCode: 401,
    redirectTo: '',
    message: 'Unauthorized'
};

// Create middleware.
const middleware = AccessControl(options);

module.exports = middleware;
