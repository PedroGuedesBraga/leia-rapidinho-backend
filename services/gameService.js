const logger = require('../logger/logger');
const userModel = require('../models/user');
const wordsModel = require('../models/word');

class GameService {
    constructor() {
        this.logger = logger;
        this.userModel = userModel;
        this.wordsModel = wordsModel;
    }

    async getWords(email) {
        try {
            this.logger.info(`Recuperando nivel do usuario de email: ${email}`);
            const userFound = await this.userModel.findOne({ email });
            if (!userFound) {
                this.logger.info(`Usuario de email ${email} nao existe na base.`)
                throw new Error('Usuario nao existe na base');
            }
            const level = userFound.level;
            const words = await wordsModel.aggregate([{ $match: { "level": level } }, { $sample: { size: 5 } }]);
            return words;
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar recuperar as palavras da base para ${email}`);
            throw new Error(`Erro ao recuperar as palavras da base`);
        }


    }
}

module.exports = GameService;