const AppError = require(`${__dirname}/utils/AppError`);

const err = new AppError('my error', 400);

console.log(err);