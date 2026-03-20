const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    const token = req.cookies.access_token;
    if (!token) {
        return res.status(401).json({ msg: "Not authenticated" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        req.user = user;
        next(); 
    } catch (error) {
        return res.status(403).json({ msg: "Invalid token" });
    }
}
module.exports = authMiddleware;