const { userRegistrationSchema, emailSchema, passwordSchema, tokenSchema } = require('../../validators/user');
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
        const email = req.query && req.query.email;
        if (token && email) {
            try {
                await this.userService.validateUserEmail(token, email)
                res.send(200);
            } catch (err) {
                res.send(500);
            }
        } else {
            res.send(400);
        }
        return next();
    }

    async createResetToken(req, res, next) {
        try {
            const { email } = req.body;
            const validation = await emailSchema.validate(email);
            if (validation.error) {
                logger.error(`Ocorreu um erro na validação do email a ter senha resetada => ${JSON.stringify({ email, error: validation.error })}`);
                res.status(400).send({ message: 'Campos mal preenchidos' });
                return next();
            }
            await this.userService.createResetToken(email);
            res.status(200).send({ message: "Token criado com sucesso" });
        } catch (err) {
            logger.error(`Ocorreu um erro na criacao do token de reset => ${JSON.stringify(err)}`);
            res.status(500).send({ message: "Erro ao criar token de reset" });
        }
        return next();
    }

    async resetPassword(req, res, next) {
        try {
            const { email, newPassword, token } = req.body;
            const emailValidation = await emailSchema.validate(email);
            const passwordValidation = await passwordSchema.validate(newPassword);
            const tokenValidation = await tokenSchema.validate(token);
            if (emailValidation.error || passwordValidation.error || tokenValidation.error) {
                logger.error(`Ocorreu um erro na validacao dos dados de entrada => ${JSON.stringify({ requestBody: req.body, error })}`);
                throw new Error('Erro na validacao dos dados de entrada')
            }
            await this.userService.resetPassword(email, newPassword, token);
            res.status(200).send({ message: 'Senha resetada com sucesso!' });
        } catch (err) {
            logger.error(`Erro ao tentar resetar a senha do usuario => ${JSON.stringify(err)}`);
            res.status(500).send({ message: 'Ocorreu um erro ao tentar redefinir a senha' });
        }
        return next();
    }

    async getUserProfile(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).send({ message: "Campos obrigatorios mal preenchidos." })
                return next();
            }
            const response = await userService.getUserProfile(email);
            res.status(200).send(response);
            return next();
        } catch (err) {
            logger.error(`Erro ao tentar recuperar perfil do usuario. => ${JSON.stringify(err)}`);
            res.status(500).send({ message: 'Ocorreu um erro interno' });
            return next();
        }
    }
}

module.exports = new UserController();

