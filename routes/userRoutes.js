// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authenticateToken = require('../middleware/auth');


router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/getUserById', authenticateToken, userController.getUserById);
router.get('/all', authenticateToken, userController.getAllUsers);
router.get('/level/:level', authenticateToken, userController.getUsersByLevel);
router.get('/downline/:userId', authenticateToken, userController.getDownline);
router.get('/function/:functionName',authenticateToken, userController. getbyFunctionName);
router.get('/functions', authenticateToken, userController.getAllFunctions);
router.get('/dailystats', authenticateToken, userController.getDailyStats);
router.get('/getUsersDetails/:userId', authenticateToken, userController.getUsersDetails);
router.get('/downlinebusiness/:parentId', authenticateToken, userController.downlinebusiness);
router.get('/currentdailystats', authenticateToken, userController.getCurrentDailyStats);

module.exports = router;

// In this code, we define the routes for user-related operations.
// Each route is associated with a specific controller function that handles the request.


   