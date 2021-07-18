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

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).send({ message: 'Credenciais inválidas' });
                return next();
            }
            const result = await this.userService.login(email, password);
            if (!result.success) {
                res.status(401).send({ message: 'Credenciais invalidas' });
            } else {
                res.status(200).send({ access_token: result.accessToken });
            }
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar logar com o email ${email}. => ${err}`);
            res.send(500);
        }
        return next();
    }

    async register(req, res, next) {
        const validation = await userRegistrationSchema.validate(req.body);
        if (validation.error) {
            logger.error(`Ocoreu um erro na validacao de dados ao tentar se registrar com os dados. Detalhes: ${JSON.stringify({ request: req.body, error: validation.error })}`);
            res.status(400).send({ message: 'Campos mal preenchidos' });
            return next();
        }
        try {
            const { userName, lastName, password, passwordConfirmation, email } = req.body;
            if (password !== passwordConfirmation) {
                logger.error(`Senha e confirmacao de senha sao diferentes ao tentar se registrar com ${email}`);
                res.status(400).send({ message: 'Campos mal preenchidos' });
                return next();
            }
            const response = await this.userService.register(userName, lastName, password, email);
            if (response.code === 0) {
                res.status(200).send({ message: response.message });
            } else {
                res.status(409).send({ message: response.message });
            }
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

