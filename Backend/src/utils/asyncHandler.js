const asyncHandler = (requestFn) => {
  return async (req, res, next) => {
    try {
      await requestFn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default asyncHandler;
