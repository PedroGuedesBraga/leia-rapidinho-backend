const express = require('express');
const app = express();
const logger = require('./logger/logger.js');

app.listen(process.env.PORT, () => {
    logger.info(`A aplicacao esta rodando na porta ${process.env.PORT}`)
});