const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');




const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);


//All the routes below this will be protected as this middleware will run first in the middleware stack. 
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', 
    userController.uploadUserPhoto, 
    userController.resizeUserPhoto, 
    userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

//Now all the routes below this will be protected as well as restricted to admin.
router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;