const userModel = require('../models/user');
const tokenModel = require('../models/token');
const logger = require('../logger/logger');
const sgMail = require('@sendgrid/mail');
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UserService {
    constructor() {
        this.userModel = userModel;
        this.tokenModel = tokenModel;
        this.logger = logger;
        this.config = config;
        this.sgMail = sgMail;
        this.jwt = jwt;
        sgMail.setApiKey(config.SENDGRID_API_KEY);
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
                const message = this._buildRegistrationEmailMessage(name, email, token);
                await sgMail.send(message);
                this.logger.debug(`Usuario cadastrado. Email enviado para o endereço ${email}`);
                return { code: 0, message: "Usuario cadastrado sem e-mail confirmado com sucesso" }
            }
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar criar um novo usuario com email ${JSON.stringify(email)} => ${JSON.stringify(err.message)}`);
            throw err;
        }
    }

    async validateUserEmail(token) {
        try {
            const decoded = await this.jwt.verify(token, this.config.EMAIL_REGISTRATION_TOKEN_SECRET);
            const email = decoded.sub;
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw new Error(`Usuario de email ${email} nao encontrado na base de dados. Não foi possivel validar`);
            }
            user.validated = true;
            await user.save()
        } catch (err) {
            this.logger.debug(`Ocorreu um erro ao tentar validar o token ${token}`);
            throw err;
        }
    }

    async createResetToken(email) {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw new Error(`Usuario de email ${email} nao encontrado na base de dados. Não foi possivel validar`);
            }
            const token = this._generateRandomToken();
            await this.tokenModel.create({ value: token, email, createdAt: new Date() });
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

            const dbToken = await this.tokenModel.findOne({ value: token, email });
            if (!dbToken) {
                this.logger.error(`Token ${token} invalido ou nao existe para o email: ${email}`);
                throw new Error('Token invalido ou nao existente');
            }
            await this.tokenModel.findByIdAndRemove(dbToken._id);
            const salt = await bcrypt.genSalt(15);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedNewPassword;
            await user.save();
        } catch (err) {
            this.logger.error(`Ocorreu um erro na redefinicao de senha do usuario com email ${email}. => ${JSON.stringify(err)}`);
            throw err;
        }
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
            <p>Olá <strong>${username}</strong>, falta só um pouco para concluir seu cadastro no Leia Rapidinho!</p>
            <p>Para concluir seu cadastro, confirme seu e-mail. Clique <a href="${this.config.EMAIL_CONFIRMATION_URL}?token=${token}">AQUI</a></p>
            <p style="font-size:11px;">
            <i>(Caso não saiba do que está sendo tratado nesse e-mail, ignore-o)</i>
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
            <p>Olá, use o código abaixo para redefinir a sua senha:</p>
            <p>CÓDIGO: <b>${token}</b></p>
            `
        }

    }




}

module.exports = new UserService();