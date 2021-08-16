const logger = require('../../logger/logger');
const { emailSchema } = require('../../validators/user');
const GameService = require('../../services/gameService');


class GameController {
    constructor() {
        this.logger = logger;
        this.emailValidator = emailSchema;
        this.gameService = new GameService();
    }

    async getWords(req, res, next) {
        try {
            const { email } = req.body;
            const validation = await this.emailValidator.validate(email);
            if (validation.error) {
                res.status(400).send({ message: "Campos obrigatorios mal preenchidos" });
                return next();
            }
            const words = await this.gameService.getWords(email);
            res.status(200).send(words);
            return next();
        } catch (err) {
            this.logger.error('Ocorreu um erro ao tentar recuperar as palavras');
            res.send(500);
        }
    }
}

module.exports = new GameController();