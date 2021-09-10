const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Global uncaught exceptions handler.
//Should be at the very top.
process.on('uncaughtException', err =>{
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err);
  console.log(err.name, err.message);
  //console.log(err);   //or can print entire err obj with stack trace.
  process.exit(1);    // Code- 0: success, 1: uncaught exception.
});

dotenv.config({ path: './config.env' });        //should be before requiring app.js
const app = require('./app');



const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true    //additionally added later from mongo error
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB connection successfully established');
});


// const port = 3000;
// const server = app.listen(port, () => {
//   console.log(`listening on port ${port}...`);
// });

const port = process.env.PORT ||3000;
const server = app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});

//global uncaught promise rejection handler.
process.on('unhandledRejection', err =>{

  console.log(err);
  console.log('UNHANDLED PROMISE REJECTION DETECTED. Shutting down...');
  server.close(() => {    //first close the server and then the node.
    process.exit(1);    // Code- 0: success, 1: uncaught exception.
  });
});