exports.globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Error";

  res.status(statusCode).json({
    message,
    error: err,
  });
};
