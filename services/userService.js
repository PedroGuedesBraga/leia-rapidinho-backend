const userModel = require('../models/user');
const { resetPasswordTokenModel, accountValidationTokenModel } = require('../models/token');
const logger = require('../logger/logger');
const sgMail = require('@sendgrid/mail');
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const gameModel = require('../models/game');
const wordsModel = require('../models/word');


class UserService {
    constructor() {
        this.userModel = userModel;
        this.resetPasswordTokenModel = resetPasswordTokenModel;
        this.accountValidationTokenModel = accountValidationTokenModel;
        this.logger = logger;
        this.config = config;
        this.sgMail = sgMail;
        this.jwt = jwt;
        sgMail.setApiKey(config.SENDGRID_API_KEY);
        this.gameModel = gameModel;
        this.wordsModel = wordsModel;
    }

    async login(email, password) {
        try {
            const user = await this.userModel.findOne({ email }).select({ password: 1, validated: 1 });
            if (!user || !user.validated) {
                return { success: false, message: "Usuario nao cadastrado" };
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return { success: false, message: "Credenciais invalidas" }
            }
            const accessToken = await jwt.sign({ sub: email, iss: "leia-rapidinho-backend" },
                this.config.ACCESS_TOKEN_SECRET,
                { expiresIn: this.config.ACCESS_TOKEN_TTL }
            );
            return { success: true, accessToken, expiration: this.config.ACCESS_TOKEN_TTL };
        } catch (err) {
            this.logger.error(`Houve um erro ao tentar realizar o login: ${err}`);
            throw err;
        }
    }

    async register(name, lastName, password, email) {
        try {
            const user = await this.userModel.findOne({ email });
            if (user && user.validated === true) {
                return { code: 1, message: "Usuario ja cadastrado" }
            } else {
                const token = this.jwt.sign(
                    { sub: email, iss: "leia-rapidinho-backend" },
                    this.config.EMAIL_REGISTRATION_TOKEN_SECRET,
                    { expiresIn: this.config.EMAIL_REGISTRATION_TOKEN_TTL }
                );
                const salt = await bcrypt.genSalt(15);
                const hashedPassword = await bcrypt.hash(password, salt);
                if (user) {
                    user.name = name; user.lastName = lastName; user.password = hashedPassword;
                    await user.save();
                } else {
                    await this.userModel.create({ name, lastName, password: hashedPassword, email, validated: false });
                }
                await this.accountValidationTokenModel.create({ value: token, email, createdAt: new Date() });
                const message = this._buildRegistrationEmailMessage(name, email, token);
                await sgMail.send(message);
                this.logger.debug(`Usuario cadastrado. Email enviado para o endere??o ${email}`);
                return { code: 0, message: "Usuario cadastrado sem e-mail confirmado com sucesso" }
            }
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar criar um novo usuario com email ${JSON.stringify(email)} => ${JSON.stringify(err.message)}`);
            throw err;
        }
    }

    async validateUserEmail(token, email) {
        try {
            const decoded = await this.jwt.verify(token, this.config.EMAIL_REGISTRATION_TOKEN_SECRET);
            const jwtEmail = decoded.sub;
            if (jwtEmail !== email) {
                throw new Error('Token invalido');
            }
            const dbToken = await this.accountValidationTokenModel.findOne({ value: token, email });
            if (!dbToken) {
                throw new Error('Token nao existe na base de dados.')
            }
            await this.accountValidationTokenModel.findByIdAndRemove(dbToken._id);
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw new Error(`Usuario de email ${email} nao encontrado na base de dados. N??o foi possivel validar`);
            }
            user.validated = true;
            await user.save();
        } catch (err) {
            this.logger.debug(`Ocorreu um erro ao tentar validar o token ${token}`);
            throw err;
        }
    }

    async createResetToken(email) {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw new Error(`Usuario de email ${email} nao encontrado na base de dados. N??o foi possivel validar`);
            }
            const token = this._generateRandomToken();
            await this.resetPasswordTokenModel.create({ value: token, email, createdAt: new Date() });
            const message = this._buildTokenEmailMessage(email, token);
            await sgMail.send(message);
            this.logger.info(`Token (${token}) para resetar senha enviado com sucesso para ${email}`);
        } catch (err) {
            this.logger.error(`Erro ao criar/enviar token para o email ${email}. Erro => ${JSON.stringify(err)}`);
            throw new Error('Erro na criacao/envio de token');
        }
    }

    async resetPassword(email, newPassword, token) {
        try {
            const user = await this.userModel.findOne({ email, validated: true });
            if (!user) {
                this.logger.error(`Usuario de email ${email} nao encontrado na base`);
                throw new Error(`Usuario de email ${email} nao encontrado na base de dados.`);
            }

            const dbToken = await this.resetPasswordTokenModel.findOne({ value: token, email });
            if (!dbToken) {
                this.logger.error(`Token ${token} invalido ou nao existe para o email: ${email}`);
                throw new Error('Token invalido ou nao existente');
            }
            await this.resetPasswordTokenModel.findByIdAndRemove(dbToken._id);
            const salt = await bcrypt.genSalt(15);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedNewPassword;
            await user.save();
        } catch (err) {
            this.logger.error(`Ocorreu um erro na redefinicao de senha do usuario com email ${email}. => ${JSON.stringify(err)}`);
            throw err;
        }
    }

    async getUserProfile(email) {
        try {
            const user = await userModel.findOne({ email });
            if (!user) {
                this.logger.error(`Nenhum usuario encontrado para ${email}`);
                throw new Error('Nenhum usuario encontrado');
            }
            const allMatches = await gameModel.find({ participantEmail: email }).sort({ date: 'desc' }).limit(15);
            const wordsRead = allMatches.reduce((acc, item) => { return [...acc, ...item.wordsRead] }, [])
            const wordsDetailed = await wordsModel.find({ word: { $in: wordsRead } });
            return {
                name: user.name,
                lastName: user.lastName,
                wordsSummary: this._summarizeWordsByDifficulty(wordsRead, wordsDetailed),
                chartData: this._summarizeWordsByMatches(allMatches)
            }
        } catch (err) {
            this.logger.info(`Erro ao recuperar perfil. ${email}`)
            throw new Error("Erro ao tentar recuperar perfil");
        }
    }

    _summarizeWordsByMatches(matches) {
        return matches.map(match => {
            return match.wordsRead.length;
        });
    }

    _summarizeWordsByDifficulty(wordsRead, wordsDetailed) {
        return wordsRead.reduce((summary, currWord) => {
            const wordDetailed = wordsDetailed.find(item => item.word === currWord);
            if (wordDetailed) {
                if (wordDetailed.level === 'easy') {
                    summary.easy++;
                } else if (wordDetailed.level === 'medium') {
                    summary.medium++;
                } else {
                    summary.hard++;
                }
            }
            return summary;
        }, { easy: 0, medium: 0, hard: 0 })
    }


    _generateRandomToken() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const TOKEN_SIZE = 6;
        let randomToken = "";
        for (let i = 0; i < TOKEN_SIZE; i++) {
            const randomNum = Math.floor(Math.random() * characters.length);
            randomToken += characters[randomNum];
        }
        return randomToken;
    }


    _buildRegistrationEmailMessage(username, email, token) {
        return {
            to: email, // Change to your recipient
            from: 'leiarapidinho.noreply@gmail.com', // Change to your verified sender
            subject: '[Leia Rapidinho] - Conclua seu cadastro',
            html: `
            <p>Ol?? <strong>${username}</strong>, falta s?? um pouco para concluir seu cadastro no Leia Rapidinho!</p>
            <p>Para concluir seu cadastro, confirme seu e-mail. Clique <a href="${this.config.EMAIL_CONFIRMATION_URL}?token=${token}&email=${email}">AQUI</a></p>
            <p style="font-size:11px;">
            <i>(Caso n??o saiba do que est?? sendo tratado nesse e-mail, ignore-o)</i>
            </p>
            `,
        }

    }

    _buildTokenEmailMessage(email, token) {
        return {
            to: email, // Change to your recipient
            from: 'leiarapidinho.noreply@gmail.com', // Change to your verified sender
            subject: '[Leia Rapidinho] - Redefina sua senha',
            html: `
            <p>Ol??, use o c??digo abaixo para redefinir a sua senha:</p>
            <p>C??DIGO: <b>${token}</b></p>
            `
        }

    }




}

module.exports = new UserService();