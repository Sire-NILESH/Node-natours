/* eslint-disable */

const catchAsync = (recievedFunction) => {
    return (req, res, next) => {
        recievedFunction(req, res, next).catch(next);
    };
};

module.exports = catchAsync;