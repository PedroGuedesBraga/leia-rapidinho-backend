const { userRegistrationSchema } = require('../../validators/user');
const logger = require('../../logger/logger');

const register = async (req, res, next) => {
    const validation = await userRegistrationSchema.validate(req.body);
    if (validation.error) {
        logger.error(`Occoreu um erro na validacao de dados ao tentar se registrar com os dados. Detalhes: ${JSON.stringify({ request: req.body, error: validation.error })}`);
        res.status(400).send({ message: 'Campos mal preenchidos' });
        return next();
    }

    const { name, lastName, password, email } = req.body;
}

module.exports = { register }

