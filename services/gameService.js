const logger = require('../logger/logger');
const userModel = require('../models/user');
const wordsModel = require('../models/word');
const gameModel = require('../models/game');

class GameService {
    constructor() {
        this.logger = logger;
        this.userModel = userModel;
        this.wordsModel = wordsModel;
        this.gameModel = gameModel;
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
            const words = await wordsModel.aggregate([{ $match: { "level": { $lte: level } } }, { $sample: { size: 5 } }]);
            const time = words.reduce((totalTime, word) => totalTime + word.readingTime, 0);
            return { words, totalTime: time, level };
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar recuperar as palavras da base para ${email}`);
            throw new Error(`Erro ao recuperar as palavras da base`);
        }
    }

    async saveGame(participantEmail, wordsRead, difficulty) {
        try {
            await gameModel.create({ participantEmail, wordsRead, difficulty, date: new Date() });
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar salvar a partida para o ${participantEmail} => ${JSON.stringify(err)}`);
            throw new Error(`Erro ao tentar salvar partida`);
        }
    }
}

module.exports = GameService;