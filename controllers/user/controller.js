const { userRegistrationSchema } = require('../../validators/user');
const logger = require('../../logger/logger');
const userService = require('../../services/userService');
const config = require('../../config/config.json');

class UserController {
    constructor() {
        this.userRegistrationSchema = userRegistrationSchema;
        this.userService = userService;
        this.config = config;
    }

    async register(req, res, next) {
        const validation = await userRegistrationSchema.validate(req.body);
        if (validation.error) {
            logger.error(`Occoreu um erro na validacao de dados ao tentar se registrar com os dados. Detalhes: ${JSON.stringify({ request: req.body, error: validation.error })}`);
            res.status(400).send({ message: 'Campos mal preenchidos' });
            return next();
        }
        try {
            const { userName, lastName, password, email } = req.body;
            await this.userService.register(userName, lastName, password, email);
            res.send(200);
        } catch (err) {
            res.send(500);
        }
        return next();
    }

    async validateUserEmail(req, res, next) {
        const token = req.query && req.query.token;
        if (token) {
            try {
                await this.userService.validateUserEmail(token)
                res.redirect(this.config.REDIRECT_EMAIL_VALIDATION_SUCCESS);
            } catch (err) {
                res.send(500);
            }
        } else {
            res.send(400);
        }
    }
}

module.exports = new UserController();

