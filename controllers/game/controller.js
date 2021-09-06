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
            const response = await this.gameService.getWords(email);
            res.status(200).send(response);
            return next();
        } catch (err) {
            this.logger.error('Ocorreu um erro ao tentar recuperar as palavras');
            res.send(500);
        }
    }

    async saveGame(req, res, next) {
        const { email, difficulty, wordsRead } = req.body;
        if (!email || !difficulty || !Array.isArray(wordsRead)) {
            res.status(400).send({ message: "Campos obrigatorios mal preenchidos" });
            return next();
        }
        try {
            this.logger.info(`Salvando jogo para email ${email} e dificuldade ${difficulty}`)
            await this.gameService.saveGame(email, wordsRead, difficulty);
            res.status(200).send({ message: "Partida salva com sucesso!" });
            return next();
        } catch (err) {
            this.logger.error('Ocorreu um erro ao tentar salvar a partida');
            res.send(500);
            return next();
        }
    }
}

module.exports = new GameController();