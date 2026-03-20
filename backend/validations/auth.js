const Joi = require('joi');

const signupSchema = Joi.object({
    username: Joi.string()
        .min(2)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 2 characters long',
            'string.max': 'Username cannot exceed 30 characters',
        }),

    email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email is required',
        }),
     password: Joi.string()
         .required(),
 
     Cpassword: Joi.ref('password'),
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .messages({
            'string.email': 'Enter a valid email address',
            'string.empty': 'Email is required',
        }),

    password: Joi.string()
        // .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),
});

const forgetSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .messages({
            'string.email': 'Enter a valid email address',
            'string.empty': 'Email is required',
        }),
});

const createPasswordSchema = Joi.object({
    password: Joi.string()
        // .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
        .required()
        .messages({
            'string.pattern.base':
                'Password must be 8–30 characters long, include uppercase, lowercase, number, and special character',
            'string.empty': 'Password is required',
        }),

    Cpassword: Joi.any()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
        }),
});

module.exports = {
    signupSchema,
    loginSchema,
    forgetSchema,
    createPasswordSchema,
};