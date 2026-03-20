const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSec = process.env.JWT_SECRET;

function checkLogin(req, res, next) {
    const authHeader = req.header('Authorization');


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ msg: "No token provided." });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, jwtSec, (err, decoded) => {
        if (err) return res.status(401).send({ msg: "Session expired, please login again." });
        req.user = decoded; 
        next();
    });
}


function jwtVerify(jwtToken) {
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, jwtSec, function (err, decoded) {
            if (err) reject(err);
            resolve(decoded);
        });
    });
}


module.exports.jwtVerify = jwtVerify
module.exports.checkLogin = checkLogin;