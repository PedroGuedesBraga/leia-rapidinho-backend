const logger = require('../logger/logger');
const userModel = require('../models/user');
const wordsModel = require('../models/word');
const gameModel = require('../models/game');
const config = require('../config/config.json');

class GameService {
    constructor() {
        this.logger = logger;
        this.userModel = userModel;
        this.wordsModel = wordsModel;
        this.gameModel = gameModel;
        this.config = config;
    }

    async getWords(email) {
        try {
            this.logger.info(`Recuperando nivel do usuario de email: ${email}`);
            const allMatches = await gameModel.find({ participantEmail: email }).sort({ date: 'desc' }).limit(100);
            const wordsRead = allMatches.reduce((acc, item) => { return [...acc, ...item.wordsRead] }, [])
            const wordsDetailed = await wordsModel.find({ word: { $in: wordsRead } });
            const level = this._getUserLevel(wordsRead, wordsDetailed)
            const userFound = await this.userModel.findOne({ email });
            if (!userFound) {
                this.logger.info(`Usuario de email ${email} nao existe na base.`)
                throw new Error('Usuario nao existe na base');
            }
            const words = await wordsModel.aggregate([{ $match: { level: level } }, { $sample: { size: 5 } }]);
            const time = words.reduce((totalTime, word) => totalTime + word.readingTime, 0);
            return { words, totalTime: time, level };
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar recuperar as palavras da base para ${email}`);
            throw new Error(`Erro ao recuperar as palavras da base`);
        }
    }

    async saveGame(participantEmail, wordsRead) {
        try {
            await this.gameModel.create({ participantEmail, wordsRead, date: new Date() });
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar salvar a partida para o ${participantEmail} => ${JSON.stringify(err)}`);
            throw new Error(`Erro ao tentar salvar partida`);
        }
    }

    _getUserLevel(wordsRead, wordsDetailed) {

        const easyWordsCounter = this._countWordsReadByDifficult(wordsRead, wordsDetailed, 'easy');
        const mediumWordsCounter = this._countWordsReadByDifficult(wordsRead, wordsDetailed, 'medium');
        let level = 'easy';
        if (easyWordsCounter >= config.EASY_WORDS_TO_MEDIUM_LEVEL) {
            level = 'medium';
        } else if (mediumWordsCounter >= config.MEDIUM_WORDS_TO_HARD_LEVEL) {
            level = 'hard';
        }
        return level;
    }

    //Count words read by difficult specified
    _countWordsReadByDifficult(wordsRead, wordsDetailed, difficult) {
        return wordsRead.filter(word => {
            return wordsDetailed.some(item => {
                return item.word === word && item.level === difficult;
            });
        }).length;
    }
}

module.exports = GameService;