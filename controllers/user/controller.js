const { userRegistrationSchema } = require('../../validators/user');
const logger = require('../../logger/logger');
const userService = require('../../services/userService');

class UserController {
    constructor() {
        this.userRegistrationSchema = userRegistrationSchema;
        this.userService = userService;
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
    }
}

module.exports = new UserController();

