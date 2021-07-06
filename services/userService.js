const userModel = require('../models/user');
const logger = require('../logger/logger');

class UserService {
    constructor() {
        this.userModel = userModel;
        this.logger = logger;
    }

    async register(name, lastName, password, email) {
        try {
            const user = await this.userModel.findOne({ email })
            if (user && user.validated === true) {
                throw new Error('Usuario ja cadastrado com esse endereço de e-mail');
            } else if (user) {
                user.name = name; user.lastName = lastName; user.password = password;
                await user.save();
            } else {
                await this.userModel.create({ name, lastName, password, email, validated: false });
            }
        } catch (err) {
            this.logger.error(`Ocorreu um erro ao tentar criar um novo usuario com email ${JSON.stringify(email)} => ${JSON.stringify(err.message)}`);
        }
    }

}

module.exports = new UserService();