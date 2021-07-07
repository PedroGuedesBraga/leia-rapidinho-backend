const userModel = require('../models/user');
const logger = require('../logger/logger');
const sgMail = require('@sendgrid/mail');
const config = require('../config/config.json');

class UserService {
    constructor() {
        this.userModel = userModel;
        this.logger = logger;
        this.config = config;
        this.sgMail = sgMail;
        sgMail.setApiKey(config.SENDGRID_API_KEY);
    }

    async register(name, lastName, password, email) {
        try {
            const user = await this.userModel.findOne({ email })
            if (user && user.validated === true) {
                throw new Error('Usuario ja cadastrado com esse endereço de e-mail');
            } else if (user) {
                const code = 1234;
                user.name = name; user.lastName = lastName; user.password = password;
                await user.save();
            } else {
                const code = 1234;
                await this.userModel.create({ name, lastName, password, email, validated: false });
            }
            const message = this._buildRegistrationEmailMessage(name, email, 'sjadaso');
            await sgMail.send(message);
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar criar um novo usuario com email ${JSON.stringify(email)} => ${JSON.stringify(err.message)}`);
        }
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

}

module.exports = new UserService();