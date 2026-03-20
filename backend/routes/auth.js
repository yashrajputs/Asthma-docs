const express = require('express');
const passport = require('passport');
const route = express.Router();
const {
    loginHandler,
    signupHandler,
    forgetPasswordHandler,
    createPasswordHandler,
    verifyOtpHandler,
    profileHandler,
    logoutHandler,
    deleteHandler,
    authCheck,
    googleCallbackHandler
} = require('../controllers/authHandler');

route.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
route.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    googleCallbackHandler
);

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication and user management endpoints
 */

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with email, password, and role.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fname
 *               - lname
 *               - email
 *               - password
 *               - Cpassword
 *               - role
 *             properties:
 *               fname:
 *                 type: string
 *                 example: John
 *               lname:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               Cpassword:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
route.post('/register', signupHandler);

route.get("/logout", logoutHandler)

route.post('/verify-otp', verifyOtpHandler);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Login successfully.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
route.post('/login', loginHandler);

route.get('/profile', profileHandler)

/**
 * @openapi
 * /api/auth/forgetPassword:
 *   post:
 *     summary: Forgot password request
 *     description: Generates a password reset token and returns a reset URL.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Token Generated
 *                 URL:
 *                   type: string
 *                   example: http://localhost:8080/api/auth/createPassword/eyJhbGciOi...
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
route.post('/forgetPassword', forgetPasswordHandler);

/**
 * @openapi
 * /api/auth/createPassword/{token}:
 *   post:
 *     summary: Reset password using token
 *     description: Verifies the token and updates the user’s password.
 *     tags:
 *       - Auth
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         description: Reset password JWT token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - Cpassword
 *             properties:
 *               password:
 *                 type: string
 *                 example: newpassword123
 *               Cpassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Passwords do not match or missing fields
 *       401:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
route.post('/createPassword/:token', createPasswordHandler);
route.delete('/delete', deleteHandler);
route.get('/me', authCheck)

module.exports = route;