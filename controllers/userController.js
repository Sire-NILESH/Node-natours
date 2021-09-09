const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


//'multer' module related to uploading of  files config

// 1) storage
// 'cb' is a call-back function having a signature as
//   cb(new Error, false) for errors or  cb(null, true) for no error.

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });         
//Above was deprecated because we will use it in 'buffer'(RAM) for our 'sharp' resizer module (will run after multer in the middlewre-stack) to work with better performance by not always going through the fileSystem to retrive the image that was stored.

const multerStorage = multer.memoryStorage();       //will store the file in the memory/buffer as inside'req.file.buffer'

// 2) Filter: allowed types are only images
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
}

//Create the middleware with settings for 'multer' that will handle image uploads
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// export the middleware
exports.uploadUserPhoto = upload.single('photo');


//'sharp' img-resizer module related to uploaded img files config
exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
    // if no file is uploaded, ignore and move on
    if(!req.file) return next();

    //since we deprecated the 'multer storage to fileystem' to now stor it into 'memory', it doest create the 'req.file.filename'
    //by default so have to create it manually onto the 'req.file' with exact name as 'filename' to avoid conflicts and err 
    //because we used that name for the check inisde the 'updateMe()' controller.
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;       //the resizer below will convert every img to 'jpeg'.

    //await this before calling next() because these are async and takes some time.
    await sharp(req.file.buffer)  //since we stored it into the buffer 
        .resize(500, 500)   //to resize into a box: 500 x 500 pixels
        .toFormat('jpeg')   //to convert to jpeg format
        .jpeg({qualtiy: 90})    //compress jpeg to 90% quality
        .toFile(`public/img/users/${req.file.filename}`);   //store

    next();     //imp: move to next middleware
});



const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);   //Do not update password by this.
exports.deleteUser = factory.deleteOne(User);

//middleware function that will add user's id onto url ie params.id as if that id came from the URL.
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};


exports.updateMe = catchAsync (async(req, res, next) => {

    // console.log(req.file);
    // console.log(req.body);


    // 1) Create error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm) {
        return next( new AppError('Cannot update password here', 400));
    }
    
    // 2) Security: filter out unwanted/sensitive field names that are not allowed to be updated by User.
    const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

    //for uploading photo through multer, files are stored on 'req.file' with name as 'filename'.
    if (req.file) {
        filteredBody.photo = req.file.filename
    }

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });

});


exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false} );       //user obj will be added on 'req' by the protect() that we will run before this.ff

    res.status(204).json({
        status: 'success',
        data: null
    });
});


exports.createUser = (req, res)=>{
    res.status(500).json({      //code 500: internal server error.
        status: 'error',
        message:'This route is not for creating account, use signup instead.'
    });
}


