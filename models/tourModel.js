const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
        //validate: [validator.isAlpha, 'Tour name must be characters only.']
    },

    slug: String,

    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },

    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty can only be: easy, medium, difficult'
        }
    },

    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'A rating must be minimum 1.0 above '],
        max: [5, 'A rating must be below 5.0'],
        //'set' works as a callback function every time this fieldd is set to some value.
        set: val => Math.round(val * 10) / 10,      //round(4.666*10) = 47/10 = 4.7  
    },

    ratingsQuantity: {
        type: Number,
        default: 0
    },

    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },

    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },

    summary: {
        type: String,
        trim: true,          //removes white spaces.
        required: [true, 'A tour must have a summary']
    },

    description: {
        type: String,
        trim: true
    },

    imageCover: {
        type: String,   //we can store images into DB but not a good practice, Store references as a string of images kept in a file system.
        required: [true, 'A tour must have a cover image']
    },

    images: [String],   //this is how we specify array of strings or anything.

    createdAt: {
        type: Date,
        default: Date.now(),     //mongo will automatically convert the millisesecs timestamp into proper date.
        select: false       //will not get selected in .select() function.
    },

    secretTour: {
        type: Boolean,
        default: false
    },

    startDates: [Date],      //array for situation like tour starting in Dec, March, July etc... in an year.

    //mongo can automatically parse string "2020-03-20,11:34" into Date type.


    // GeoJSON type field are different than others. Has a nested obj inside it.
    startLocation: {
        //GeoJSON      (mongoDB built in format for storing geospatial data in JSON format.)
        //requires 2 mandatory attributes: type{} and coordinates{}
        type: {
            type: String,       //has to be string
            default: 'Point',       //can be point, polygon etc... 
            enum: ['Point']
        },
        coordinates: [Number],      //[lattitude, longitude]
        address: String,
        description: String
    },

    locations: [            //this is how embedding is done. Using an array of objs
        //Is also a GeoJSON
        {
            type: {
                type: String,
                default: 'Point', 
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],

    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
);

//Indexes for READ optimization.
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound
tourSchema.index({ slug: 1 });      // single, 1: asc, -1: desc
tourSchema.index({ startLocation: '2dsphere'});


tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

//virtual property to only get reviews on results but never persist that into DB.
tourSchema.virtual('reviews', {     //name of virtual field
    ref: 'Review',             //collection name from where review is to be fetched from.
    foreignField: 'tour',       //name of that field in Review collection 
    localField: '_id'       //since 'tour' had 'mongoose.Schema.ObjectId' in it, specify the field here in Tour collection where it can be found. 
});



//DOCUMENT MIDDLEWARE: runs before .save() and .create() only and none other(update/insert etc).
//here 'this' points to the document.

tourSchema.pre('save', function (next) {                  //arrow func dont have accesss to 'this'
    this.slug = slugify(this.name, { lower: true });
    next();
});


// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map( async id => await User.findByid(id) );
//     this.guides = await Promise.all(guidesPromises);
    
//     next();
// });

//can have multiple middlewares
// tourSchema.pre('save', function(next){
//     console.log('will save the document');
//     next();
// });


// tourSchema.post('save', function(doc, next){    //will exe after the save.
//     console.log(doc);       //post has access to the document that was saved and not 'this'
//     next();
// });


//Query middlewares('this' points to the query)
// tourSchema.pre('find', function(next){})     //this only works for 'find' and not findOne/findMany

tourSchema.pre(/^find/, function (next) {         //regular expression that will match anything that starts with 'find' or  we have option to make middlewares for each.
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});



//hook to populate references relations
tourSchema.pre(/^find/, function(next) { //regular expression that will match anything that starts with 'find'.

    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
})


tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} millisesecs`);
    //console.log(docs);
    next();
});


//Aggregation middlewares('this' points to the current aggregation object)
//to remove secret tours from the aggregation results.
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     //above '$match' will get added as a stage on top of the pipepline array(aggregation stages array).
//     console.log(this.pipeline());
//     next();
// });


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;