const AppError = require('../utils/AppError');

const handleCastErrorDB       = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for '${field}': "${err.keyValue[field]}". Please use a different value.`, 409);
};
const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 422);
};
const handleJWTError        = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => res.status(err.statusCode).json({
  status: err.status, error: err, message: err.message, stack: err.stack,
});

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error: { code: String(err.statusCode), message: err.message, details: null },
    });
  } else {
    console.error('UNHANDLED ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      error: { code: '500', message: 'Something went wrong on our end.', details: null },
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    if (error.name === 'CastError')         error = handleCastErrorDB(error);
    if (error.code  === 11000)              error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')   error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
