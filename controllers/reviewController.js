const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');


exports.setTourUserIds = (req, res, next) =>{           //middleware before createReview.
    //define tour and routes into req.body if not from the nested route.
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;      //'user' will be added on req by authController.protect.

    next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
