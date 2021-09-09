const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview =  catchAsync( async(req, res, next) => {

    //1) Get tour data from collection.
    const tours = await Tour.find();

    //2) Build the pug template for overview

    //3) Render

    res.status(200).render('overview', {
        title: 'All Tours',
        tours: tours
    });
});



exports.getTour = catchAsync(async(req, res, next) => {

    // 1) Get tour data from collection.
    const tour = await Tour.findOne({slug: req.params.slug}).populate({path: 'reviews'});             //guides will be populated automatically as a hook is defined for that in the tourModel.js

    if(!tour) {
        return next(new AppError('There is no tour with that name'), 404)
    };

    //2) Build the pug template for tour

    //3) Render

    //solution 1: by mapboxgl website
    res
        .status(200)
        .set(
            'Content-Security-Policy',
            'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com'
        )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour: tour 
        }
    );


    //solution 2: by explicitly setting CSP
    // res
    // .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    // )
    // .render('tour', {
    //   title: `${tour.name} Tour`,
    //   tour,
    // });

    // res.status(200).render('tour', {
    //     title: `${tour.name} Tour`,
    //     tour: tour
    // });
}); 

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Sign in your account'
    });
};

exports.getSignupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Create a new account'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
};

exports.getMyTours = catchAsync( async(req, res, next) => {
    // 1) Find all the bookings 
    const bookings = await Booking.find({ user: req.user.id });
    
    // 2) Find tours from the returned bookings.
    const tourIds = bookings.map(el => el.tour);    // get all the tourIDs
    const tours = await Tour.find({ _id: { $in: tourIds} });

    //we will reuse the overview.pug to render my bookings.
    res.status(200).render('overview', {
        title: 'My booked tours',
        tours
    });
});

exports.updateUserData = catchAsync( async(req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    });
});