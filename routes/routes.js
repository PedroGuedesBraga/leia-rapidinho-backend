const router = require('express').Router();
const usersController = require('../controllers/user/controller');
const gameController = require('../controllers/game/controller');
const { authenticate } = require('../middlewares/authentication');
const BASE = '/users'

router.post(`${BASE}/register`, usersController.register.bind(usersController));
router.post(`${BASE}/login`, usersController.login.bind(usersController));
router.get(`${BASE}/verify`, usersController.validateUserEmail.bind(usersController));
router.post(`${BASE}/reset/validate`, usersController.resetPassword.bind(usersController));
router.post(`${BASE}/reset/send`, usersController.createResetToken.bind(usersController));
router.get(`${BASE}/profile`, authenticate, usersController.getUserProfile.bind(usersController));
router.post(`/words`, authenticate, gameController.getWords.bind(gameController));
router.post(`/saveGame`, authenticate, gameController.saveGame.bind(gameController));

module.exports = router;