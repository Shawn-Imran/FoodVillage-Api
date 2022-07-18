const ipfilter = require('express-ipfilter').IpFilter

// Allow the following IPs
const ips = ['0.0.0.0/0'];

module.exports = ipfilter(ips, { mode: 'allow' });
