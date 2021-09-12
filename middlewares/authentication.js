const jwt = require('jsonwebtoken');
const config = require('../config/config.json');

const authenticate = (req, res, next) => {
    try {
        const { 'x-access-token': token } = req.headers;
        if (!token) {
            res.send(403);
            return;
        }
        const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
        req.body.email = decoded.sub;
        return next();
    } catch (err) {
        res.send(403);
    }
}

module.exports = {
    authenticate
}