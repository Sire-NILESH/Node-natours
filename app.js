const path = require('path');                       //built in nodeJS
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');


const app = express();
//app.use(express.json());    //app.use() defines a middleware. Every data we get from the client will go through this middleware and get converted into a JSON. 


//Using 'app.set()' setting up rendering engine config: 'view engine' and 'views'
app.set('view engine', 'pug');               //pug is built in supported so no need to require it but install it from npm.
app.set('views', path.join(__dirname, 'views'));


// GLOBAL middlewares

//Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));        //will join dirname and rest of the path.


//Set security HTTP headers (has to be the very 1st middleware to set all the security headers)
app.use(helmet());      //helmet() returns a function that will be called, hence we have to call helemt immediately with () here.

// app.use(
//     helmet({
//       contentSecurityPolicy: false,
//     })
// );

// app.use(
//     helmet.contentSecurityPolicy({
//       useDefaults: false,
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "http://*.mapbox.com*"],
//       },
//     })
//   );
//'https://api.mapbox.com/mapbox-gl-js/v2.3.1/mapbox-gl.js'

//Development Logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));		//gives small detail about the request(route) and response.
}


//Rate limiting requests
const limiter = rateLimit({
    max:100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour'
});
app.use('/api', limiter);



//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));   //parses the req JSON
app.use(express.urlencoded({extended: true, limit: '10kb' }));  //for parsing data comming from the frontend forms. By default they come as 'urlencoded'.
app.use(cookieParser());        //parses the data from the cookie from req JSON. Can be used as 'req.cookies'


//Data sanitization against NoSql query injection
app.use(mongoSanitize());


//Data sanitization against XSS
app.use(xss());


//Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsAverage',
            'ratingsQuantity',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);




// custom middleware
app.use((req, res, next) =>{
    //console.log('hello from the middleware');
    console.log(req.cookies);
    next();
});


// Test middleware
app.use((req, res, next) =>{
    req.requestTime = new Date().toISOString();
    next();
});


module.exports = app;



// Routing is defined in their respective routes modules 


//Mounting (mounting of sub-routes to the parent routes below)
//Mounting is how we connect it to our application by using parent routes as middlewares.
//rendering mounts
app.use('/', viewRouter);

//api mounts
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);



//if any route that wasn't caught by above will be handled below with error. '*' means all.
//we can use app.get(), app.post() ... for each http methods or
//app.all() includes all http methods(get/post/patch...)
// app.all('*', (req, res, next) =>{           
//     res.status(404).json({
//         status: 'fail',
//         message: `Can't find ${req.originalUrl}, That's all we can say now`
//     });
// });

app.all('*', (req, res, next) =>{           
    next(new AppError(`Can't find ${req.originalUrl}, That's all we can say for now`, 404));
});


//Finally invoking globalErrorHandler middleware.
app.use(globalErrorHandler);