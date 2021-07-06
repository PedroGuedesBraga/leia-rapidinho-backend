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
        .pattern(/[A-Za-z0-9]*/)
        .min(8)
        .max(30)
        .required(),
    email: Joi.string()
        .email()
        .required()
}).required();

module.exports = { userRegistrationSchema };