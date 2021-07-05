const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('./logger/logger.js');
const config = require('./config/config.json');
const bodyParser = require('body-parser');
const fs = require('fs');

const dbConnection = config.dbConnectionString;
app.use(bodyParser.json());

//Importando rotas na aplicacao
fs.readdirSync('./routes').forEach(filename => {
    let route = require(`./routes/${filename}`);
    app.use(route)
});

//Conectando a aplicacao na base de dados
mongoose.connect(dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info(`Conectado na base de dados: ${dbConnection}`)
});

//Iniciando servidor
app.listen(process.env.PORT, () => {
    logger.info(`A aplicacao esta rodando na porta ${process.env.PORT}`);
});