const axios = require("axios");
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_HOST_USER; 

const sendEmail = async (username, email, otp) => {
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { 
                    name: "Dragend Team", 
                    email: SENDER_EMAIL 
                },
                to: [
                    { 
                        email: email, 
                        name: username 
                    }
                ],
                subject: "One-Time Password (OTP) Verification",
                htmlContent: `<p>Hi ${username},</p><p>Your verification code is: <strong>${otp}</strong></p><p>If you did not request this, please ignore this email.</p>`,
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                }
            }
        );
        
        console.log("Email sent successfully via Brevo HTTP API!");
        return response.data;
    } catch (err) {
        // Yeh error exactly batayega agar Brevo API mein koi issue hoga
        console.error("Brevo API error:", err.response ? err.response.data : err.message);
        throw err;
    }
};

module.exports = sendEmail;