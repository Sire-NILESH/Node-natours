const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router( { mergeParams: true } );

//All the routes below this will be protected as this middleware will run first in the middleware stack.
router.use(authController.protect);

//nested
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );


//restrict to users and admin only. Guides should not be allowed to post or manipulate reviews.
router 
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview)
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview);

module.exports = router; 