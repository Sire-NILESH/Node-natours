const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);;
}


const handleDuplicateFieldsDB = (err, res) => {
    //err.message: "E11000 duplicate key error collection: natours.tours index: name_1 dup key: { name: \"The Forest Hiker\" }"
    
    //const value = err.message.match(/(["'])(\\?.)*?\1/);   //regex to read anything betweeen "" from above.
    const value = err.keyValue.name;
    const message = ` Already in use duplicate field: ${value}.`;
    return new AppError(message, 400);
}; 


const handleValidationErrorDB = (err, res) => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};


const handleJWTError = ()=> new AppError('Invalid token. Please log in again.', 401);


const handleJWTExpiredError = ()=> new AppError('Your token has expired. Please log in again.', 401);


const sendErrorDev = (err, req, res) => {

    // for API, only send JSON 
    if (req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    
        // for Website, render the error page.
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message        //because we are in dev
    });
    
};


const sendErrorProd = (err, req, res) => {

    // 1) for API, only send JSON 
    if (req.originalUrl.startsWith('/api')) {
        
        // A) Operational, trusted error: send message to client and
        if(err.isOperational) {
            return res.status(err.statusCode).json({
                 status: err.status,
                 message: err.message
            });
        }
        
        // B) Programming or other unknown errors: dont leak err details. 
        // 1) Log error
        console.error('ERROR', err);


        // 2) Send generic message
        return res.status(500).json({
                status: 'error', 
                message: 'something went wrong!'
        });
        
    }

    // 2) for Website, render the error page.
    if(err.isOperational) {
        console.error('ERROR', err);    //for backend err log
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message        //because operational.
        });
    }

    // B) Programming or other unknown errors: dont leak err details. 
    // 1) Log error
    console.error('ERROR', err);    //for backend err log
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg:    'Please try again later'     //no leaks
    });
};


module.exports = function(err, req, res, next){

    err.statusCode = err.statusCode || 500;         //500 is internal server error.
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);

    } else if(process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;        //this field for some reason doest gets copied so had to do it manually.

        console.log('errorMsg: ',error.message);

        if(err.name === 'CastError') error = handleCastErrorDB(error);
        if(err.code === 11000) error = handleDuplicateFieldsDB(error);
        if(err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(err.name === 'JsonWebTokenError') error = handleJWTError();
        if(err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        
        sendErrorProd(error, req, res);
    }

};