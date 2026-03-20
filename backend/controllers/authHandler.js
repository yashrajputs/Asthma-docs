const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtVerify } = require("../common");
const {
  signupSchema,
  loginSchema,
  forgetSchema,
  createPasswordSchema,
} = require("../validations/auth");
const sendEmail = require("../utils/SendEmail");
require("dotenv").config();

const jwtSec = process.env.JWT_SECRET;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", 
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

async function googleCallbackHandler(req, res) {
  try {
    const user = req.user;
    const payload = { userId: user._id, email: user.email };
    const token = jwt.sign(payload, jwtSec, { expiresIn: "1h" });

    res.cookie("access_token", token, {
      ...getCookieOptions(),
      maxAge: 60 * 60 * 1000,
    });

    const frontendURL = process.env.NODE_ENV === 'production' 
      ? 'https://dragend-h8cjcqdsfcc8gaex.centralindia-01.azurewebsites.net' 
      : 'http://localhost:5173';
      
    res.redirect(frontendURL);
  } catch (err) {
    return res.status(500).json({ msg: "Login failed", error: err.message });
  }
}

async function loginHandler(req, res) {
  try {
    await loginSchema.validateAsync(req.body);
    const { email, password } = req.body;
    const isAvailabe = await User.findOne({ email: email });

    if (!isAvailabe)
      return res.status(404).send({ msg: "Invalid credentials." });

    const passMatch = await bcrypt.compare(password, isAvailabe.password);
    if (!passMatch)
      return res.status(401).send({ msg: "Invalid credentials." });

    const payload = { userId: isAvailabe._id, email: isAvailabe.email };
    const token = jwt.sign(payload, jwtSec, { expiresIn: "1h" });

    res.cookie("access_token", token, {
      ...getCookieOptions(),
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).send({ msg: "Login successfully." });
  } catch (err) {
    return res.status(500).send({ msg: "Server Error", err: err.message });
  }
}

async function logoutHandler(req, res) {
  try {
    res.clearCookie("access_token", getCookieOptions());
    return res.status(200).json({ authenticated: false, msg: "Logged out successfully." });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Server error during logout.", error: err.message });
  }
}

async function signupHandler(req, res) {
  try {
    await signupSchema.validateAsync(req.body);
    const { username, email, password, Cpassword } = req.body;

    if (password !== Cpassword)
      return res.status(400).send({ msg: "Passwords do not match." });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).send({ msg: "User already exists." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000);
    const newUser = await User.create({
      username,
      email,
      password: passwordHash,
      otp,
      otpExpires: Date.now() + 3 * 60 * 1000,
      isVerified: false,
    });

    await sendEmail(username, email, otp);
    return res
      .status(201)
      .send({ msg: "Signup successful. OTP sent to email." });
  } catch (err) {
    return res.status(500).send({ msg: "Server error", error: err.message });
  }
}

async function verifyOtpHandler(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).send({ msg: "Email and OTP are required." });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ msg: "User not found." });
    if (user.isVerified)
      return res.status(400).send({ msg: "User already verified." });
    if (user.otp !== otp) return res.status(400).send({ msg: "Invalid OTP." });
    if (user.otpExpires < Date.now())
      return res
        .status(400)
        .send({ msg: "OTP expired. Please request a new one." });
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    return res.status(200).send({ msg: "Email verified successfully." });
  } catch (err) {
    return res.status(500).send({ msg: "Server error", error: err.message });
  }
}

async function resendOtpHandler(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ msg: "Email is required." });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ msg: "User not found." });
    if (user.isVerified)
      return res.status(400).send({ msg: "User already verified." });
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    user.otp = newOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendEmail(user.username, email, newOtp);
    return res.status(200).send({ msg: "New OTP sent to email." });
  } catch (err) {
    return res.status(500).send({ msg: "Server error", error: err.message });
  }
}

async function profileHandler(req, res) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ msg: "Not authenticated" });

  try {
    const decoded = await jwtVerify(token);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).send({ msg: "User not found" });
    res.send({ authenticated: true, user });
  } catch (err) {
    res.status(403).send({ authenticated: false, msg: "Invalid token" });
  }
}

async function forgetPasswordHandler(req, res) {
  try {
    await forgetSchema.validateAsync(req.body);
    const { email } = req.body;
    if (!email)
      return res.status(400).send({ msg: "Email fields is required." });

    const isAvailabe = await User.findOne({ email: email });

    if (!isAvailabe) return res.status(404).send({ msg: "User Not Found." });

    const resetToken = jwt.sign({ email }, jwtSec, { expiresIn: 120 });
    const URL = `http://localhost:8080/api/auth/createPassword/${resetToken}`;

    return res.status(200).send({ msg: "Token Generated", URL });
  } catch (err) {
    return res.status(500).send({ msg: "Server error.", error: err.message });
  }
}

async function createPasswordHandler(req, res) {
  try {
    await createPasswordSchema.validateAsync(req.body);
    const { token } = req.params;
    const { password, Cpassword } = req.body;

    if (!password || !Cpassword)
      return res.status(400).send({ msg: "All fields are required" });

    if (password !== Cpassword)
      return res.status(400).send({ msg: "Passwords do not match." });

    const tokenIsValid = await jwtVerify(token);
    if (!tokenIsValid.email)
      return res.status(401).send({ msg: "Invalid or expired token." });

    const user = await User.findOne({ email: tokenIsValid.email });
    if (!user) return res.status(404).send({ msg: "User not found." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user.password = passwordHash;
    await user.save();

    return res.status(200).send({ msg: "Password updated successfully." });
  } catch (err) {
    return res.status(500).send({ msg: "Server error.", error: err.message });
  }
}

async function deleteHandler(req, res) {
  const id = req.params.username;
  try {
    const user = await User.findOne({ username: id });
    if (!user) return res.status(404).json({ msg: "Not found" });
    await user.deleteOne();
    res.json({ success: true, msg: "User deleted" });
  } catch (e) {
    res.status(500).json({ msg: "Delete failed" });
  }
}

async function authCheck(req, res) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).send({ authenticated: false });

  try {
    jwt.verify(token, jwtSec);
    return res.send({ authenticated: true });
  } catch {
    return res.status(401).send({ authenticated: false });
  }
}

module.exports.createPasswordHandler = createPasswordHandler;
module.exports.loginHandler = loginHandler;
module.exports.signupHandler = signupHandler;
module.exports.forgetPasswordHandler = forgetPasswordHandler;
module.exports.verifyOtpHandler = verifyOtpHandler;
module.exports.profileHandler = profileHandler;
module.exports.logoutHandler = logoutHandler;
module.exports.deleteHandler = deleteHandler;
module.exports.authCheck = authCheck;
module.exports.googleCallbackHandler = googleCallbackHandler;