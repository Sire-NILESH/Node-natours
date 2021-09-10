const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email= require('./../utils/email');

const signToken = function (id) {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

};


const createSendToken = function (user, statusCode, req, res) {
    const token = signToken(user._id);

    res.cookie('jwt', token, { 
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers('x-forwarded-proto') === 'https'
    });

    // old, unsecure and deprecated.
    // const cookieOptions = { 
    //     expires: new Date(
    //         Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //     ),
    //     //secure: true, //will be set below according to ENVIORNMENT.
    //     httpOnly: true,
    // };

    // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    // res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {            //data is the envolope containig real data
            user: user
        }
    });
};



exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut',{             //'loggedOut' is just a dummy text
        expires: new Date(Date.now() + 1000),
        httpOnly: true,
    });

    res.status(200).json({
        status: 'success'
    });

};


exports.signup = catchAsync(async (req, res, next) => {
    //const newUser = await User.create(req.body);          //bad practice.

    //do this instead
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        //passwordChangedAt: req.body.passwordChangedAt,
    });

    //send a welocme email
    // const url = 'http://localhost:3000/me';
    const url = `${req.protocol}://${req.get('host')}/me`;

    //await this first and only then below code will be executed.
    await new Email(newUser, url).sendWelcome();    //'sendWelocme()' is a function on Email class.

});


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    //Check if user exists & password is correct.
    const user = await User.findOne({ email: email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //if everything is ok, send token to client
    createSendToken(user, 200, req, res);
});


exports.protect = catchAsync(async (req, res, next) => {
    //1) Getting token and check it's there
    //console.log(req.headers);
    let token;
    //check for token in req header for api and req.cookies for the rendering part beause browser automatically send cookies on every req as we implemented it like that on the client side.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt){
        token = req.cookies.jwt;
    }


    if (!token) {
        return next(new AppError('You need to be logged in first!'));
    }

    //2) Verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);
    //console.log(decoded.iat);     //decoded.iat is the timestamp for token issued date.


    //3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The user belonging to this id does no longer exist.', 401));
    }

    //4) Check if password was changed after the token was granted.
    if(freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    //5) Grant access to PROTECTED route
    //add the user on the req obj : IMPORTANT, this will be the verifed user that made the request according to system.
    req.user = freshUser;       //this will be used for like verifying role of the user in other middlewares.
    //Add the user on the 'res.locals'. Now these will be available to all the pug templates.
    res.locals.user = freshUser;        //for the pug templates to render.
    next();
});


//middleware to only check if user is logged in? if yes then render his image onto the header of the page.
//code is a lot similar to that of protect middlewre.
//has nothing to do with protect middleware so dont send any errors simply ignore.
exports.isLoggedIn = async (req, res, next) => {        //is not a catchAsync! as we don't want any errors
    //1) Getting token and check it's there
    //check for token in req.cookies for the rendering part beause browser automatically send cookies on every req as we implemented it like that on the client side.
    if (req.cookies.jwt){
    
        try{
            //2) Verification of token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);


            //3) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();      //simply ignore
            }

            //4) Check if password was changed after the token was granted.
            if(currentUser.changedPasswordAfter(decoded.iat)) {
                return next();      //simply ignore
            }

            //5) All pass! then there is a logged-in user
            //Add the user on the 'res.locals'. Now these will be available to all the pug templates.
            res.locals.user = currentUser;
            return next();                 //move onto next middleware
    } catch (err) {
        next();             //err will occur with loggedOut JWT verify. Do nothing
    }
}

    //if no jwt token then none is logged in then simply ignore.
    next();
};


exports.restrictTo = function(...roles) {
    return (req, res, next) => {
        //roles array:['admin', 'lead-guide']. role = 'user'.
        if(!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
};


exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne( { email: req.body.email } );
    if(!user) {
        return next(new AppError('There is no user with this email address'), 404);
    }

    // 2) Generate the random reset Token
    const resetToken = user.createPasswordResetToken();
    await user.save( {validateBeforeSave: false} );         //saving to DB.

    // 3) Send it to user's email
    
    
    try {
        // await sendEmail({ 
            //     email:user.email,       //can use req.body.email
            //     subject: 'Your password reset token (vaild for 10 mins).', 
            //     message
            // });
            
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        //send the email to user
        //await this first and only then below code will be executed.
        await new Email(user, resetURL).sendPasswordReset();    //'sendPasswordReset()' is a function on Email class.


        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });

    } catch (err) {
        //in case of err, rollback
        user.passwordResetToken = undefined;    
        user.passwordResetExpires = undefined;

        await user.save( {validateBeforeSave: false} );         //saving to DB.

        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }

});


exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne( { 
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });


    // 2) If token has not expired, and there is user, set the new password
    if(!user) {
        return next( new AppError('Token is invalid or expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();          //we want the validators to run

    //3) Update changed PasswordAt property fo the user
        //implementd as pre save hook inside userModel.js

    // 4) Log the user in, send new JWT
    createSendToken(user, 200, req, res);
    
});


exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');


    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next( new AppError('Your current password is incorrect', 401));
    } 


    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //User.findByIdAndUpdate will not work as many of our hooks and validators only work for 'save'. errs like unhashed pass etc


    //4) Log user in, send new JWT
    createSendToken(user, 200, req, res);

});


