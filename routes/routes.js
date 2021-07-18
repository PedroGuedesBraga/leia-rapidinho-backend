const router = require('express').Router();
const usersController = require('../controllers/user/controller')
const BASE = '/users'

router.post(`${BASE}/register`, usersController.register.bind(usersController));
router.post(`${BASE}/login`, usersController.login.bind(usersController));
router.get(`${BASE}/verify`, usersController.validateUserEmail.bind(usersController));

module.exports = router;