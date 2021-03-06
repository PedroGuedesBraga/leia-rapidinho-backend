const Joi = require('joi');

const userRegistrationSchema = Joi.object({
    userName: Joi.string()
        .pattern(/([A-Za-z])+/)
        .min(2)
        .max(50)
        .required(),
    lastName: Joi.string()
        .pattern(/([A-Za-z])+/)
        .min(2)
        .max(50)
        .required(),
    password: Joi.string()
        .alphanum()
        .pattern(/([0-9]+[A-Za-z]|[A-Za-z]+[0-9])[A-Za-z0-9]*/)
        .min(8)
        .max(30)
        .required(),
    passwordConfirmation: Joi.string()
        .alphanum()
        .pattern(/([0-9]+[A-Za-z]|[A-Za-z]+[0-9])[A-Za-z0-9]*/)
        .min(8)
        .max(30)
        .required(),
    email: Joi.string()
        .email()
        .required()
}).required();

const emailSchema = Joi.string().email().required();

const passwordSchema = Joi.string()
    .alphanum()
    .pattern(/([0-9]+[A-Za-z]|[A-Za-z]+[0-9])[A-Za-z0-9]*/)
    .min(8)
    .max(30)
    .required();

const tokenSchema = Joi.string().alphanum().min(6).max(6).required();

module.exports = { userRegistrationSchema, emailSchema, passwordSchema, tokenSchema };