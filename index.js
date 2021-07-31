const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('./logger/logger.js');
const config = require('./config/config.json');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const dbConnection = config.DB_CONNECTION_STRING;
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

app.on('request', (req, res, next) => {
    console.log("request: " + JSON.stringify(req))
})

//Importando rotas na aplicacao
const userRoutes = require('./routes/routes')

app.use(userRoutes);

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