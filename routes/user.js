const router = require('express').Router();
const usersController = require('../controllers/user/controller')
const BASE = '/users'

router.use(`${BASE}/register`, usersController.register.bind(usersController));

module.exports = router;