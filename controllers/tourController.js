const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');





//'multer' module related to uploading of  files config
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
// exports.uploadTourImages = upload.single('image');       // 1 upload, stores on 'req.file'
// exports.uploadTourImages = upload.array('image', 5);     // same multiple, (macCOunt 5) here uploads with name 'image',  stores on 'req.files'
exports.uploadTourImages = upload.fields([                  //multiple different names of uploads, stores on 'req.files'
    {name: 'imageCover', maxCount: '1'},
    {name: 'images', maxCount: '3'}
]);


//resize using 'sharp'
exports.resizeTourImages = catchAsync(async(req, res, next) => {
    console.log(req.files);

    if(!req.files.imageCover || !req.files.images) return next();

    // Have to process every file separately

    // 1) imageCover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;     //imp to put this on 'req.body' as our 'updateMe' handler only updates contents from req.body

    // await this before calling next() because these are async and takes some time.
    await sharp(req.files.imageCover[0].buffer)                 //since we stored it into the buffer 
            .resize(2000, 1333)   //to resize into a box: 2000x1333 pixels
            .toFormat('jpeg')   //to convert to jpeg format
            .jpeg({qualtiy: 90})    //compress jpeg to 90% quality
            .toFile(`public/img/tours/${req.body.imageCover}`);   //store



    
    // 2) all other images
    req.body.images = [];    //imp to put this on 'req.body' as our 'updateMe' handler only updates contents from req.body

    await Promise.all(
        req.files.images.map(async(file, i)=> {
            const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;

            await sharp(file.buffer)                 //since we stored it into the buffer 
                .resize(2000, 1333)   //to resize into a box: 2000x1333 pixels
                .toFormat('jpeg')   //to convert to jpeg format
                .jpeg({qualtiy: 90})    //compress jpeg to 90% quality
                .toFile(`public/img/tours/${filename}`);   //store

            req.body.images.push(filename);         //put every file on the images[]
        })
    );


    next();     //imp: move to next middleware
});

// const APIfeatures =  require('./../utils/apiFeatures');
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};


exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path:'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);


exports.getTourStats = catchAsync(async (req, res, next)=>{
    
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
            {
                $sort: { avgPrice: 1 }
            },
            // {
            //     $match: { _id: { $ne: 'EASY'}}
            // }
        
    ]);

    res.status(201).json({      
        status:'success',
        data:{
            tour: stats
            }
    });       
});


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
   
    const year = req.params.year * 1;       //remember to convert into Number, default is a string.

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates'},
                numTours: { $sum: 1 },
                tours: { $push: '$name' }   //creates an array of 'name' feilds from original doc.
            }
        },
        {
            $addFields: { month: '$_id' }   //will create a new feild in the result doc.
        },

        {
            $project: {
                _id: 0          //here _id feild, 0 for not to show up, 1 to show up in final result.
            }
        },
        {
            $sort: { numTourStarts: -1 }    //sort Descending
        },
        {
            $limit: 12          //can also use limit.
        }

    ]);

    res.status(201).json({      
        status:'success',
        data:{
            tour: plan
            }
    });
});




// /tours-within/300/center/-40,45/unit/mi          //standard method
// or
// /tour-within?distance=300&center=-40,45&unit=mi      //query string
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng)
        next( new AppError('Please specify latitude and longitude as lat,lng', 400)
    );

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] }}
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });

});


exports.getDistances = catchAsync(async (req, res, next) => {

    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng)
        next( new AppError('Please specify latitude and longitude as lat,lng', 400)
    );

    //calculate distance using aggregation pipeline.
    const distances = await Tour.aggregate([
        { 
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },

                distanceField: 'distance',

                distanceMultiplier: multiplier
            }
        },

        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    //send response
    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances
        }
    });

});