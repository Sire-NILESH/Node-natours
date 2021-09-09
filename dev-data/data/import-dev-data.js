const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');


dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true     //additionally added later from mongo error
  })
  .then(() => {
    console.log('DB connection successfully established');
});


//read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'));


//Importing Data into DB
const importData = async ()=> {
    try{
        await Tour.create(tours);   //'tours' is an array. this func can take an array
        await User.create(users, { validateBeforeSave: false }); //'users' is an array. this func can take an array
        //validation turned off explicitly as we wont be providing password confirm field.
        await Review.create(reviews); //'reviews' is an array
        console.log('Data loaded into DB')


        //also turn off password encryption in the pre and save hooks as we will provide encrypted passwords.

    }catch(err){
        console.log(err);
    }

    process.exit();     //to exit out of program. Kinda aggressive way to use.
};


//Delete all data from DB
const deleteData = async() =>{
    try{
        await Tour.deleteMany();   //if no arg passed it will delete all docs from Tour collection.
        await User.deleteMany();
        await Review.deleteMany();
        console.log('All Data deleted from DB')

    }catch(err){
        console.log(err);
    }

    process.exit();     //to exit out of program. Kinda aggressive way to use.
};

//console.log(process.argv);        //will show all the args passed from cli at the time of calling this program.

if(process.argv[2] === '--import') {
    importData();
}else if (process.argv[2] === '--delete') {
    deleteData();
}