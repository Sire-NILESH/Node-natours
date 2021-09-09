const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');


const router = express.Router();

//router.param('id', tourController.checkID);           //we deleted checkID() from the tourCOntroller.


//Nested routes, tour route to review
//POST /tour/7934257973/reviews
router.use('/:tourId/reviews', reviewRouter);   //mounting

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);             //tourController.aliasTopTours is a custom middleware

router
    .route('/tour-stats')          //to get stats
    .get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')         //to find busiest month
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan);

// /tours-within/300/center/-40,45/unit/mi          //standard method
// or
// /tour-within?distance=300&center=-40,45&unit=mi      //query string
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);


router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

router
    .route('/')             //its root is now the route of its parent's route in the middleware.
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);   
    
router
    .route('/:id') 
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour
);



module.exports = router;