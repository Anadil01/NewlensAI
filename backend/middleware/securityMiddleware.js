const helmet = require("helmet");  // Helmet is Express middleware that helps secure an application by setting various HTTP security headers.

const securityHeaders = helmet();

module.exports = securityHeaders;