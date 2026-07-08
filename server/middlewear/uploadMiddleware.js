import multer from "multer";

const TEN_MB = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfName = file.originalname?.toLowerCase().endsWith(".pdf");

  if (!isPdfMime || !isPdfName) {
    const error = new Error("Only PDF files are allowed");
    error.statusCode = 400;
    error.code = "INVALID_FILE_TYPE";
    return cb(error, false);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: TEN_MB,
    files: 2,
  },
  fileFilter,
});

const fieldsUploader = upload.fields([
  { name: "policy", maxCount: 1 },
  { name: "estimate", maxCount: 1 },
]);

const sendValidationError = (res, statusCode, message) =>
  res.status(statusCode).json({
    message,
  });

export const uploadPdfDocuments = (req, res, next) => {
  fieldsUploader(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return sendValidationError(
          res,
          413,
          "Each PDF must be 10 MB or smaller."
        );
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return sendValidationError(
          res,
          400,
          "Please upload only one policy PDF and one estimate PDF."
        );
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return sendValidationError(
          res,
          400,
          "Please upload only one policy PDF and one estimate PDF."
        );
      }

      if (error.code === "INVALID_FILE_TYPE") {
        return sendValidationError(res, 400, error.message);
      }

      return sendValidationError(
        res,
        error.statusCode || 400,
        error.message || "Failed to upload PDF files."
      );
    }

    const policyFile = req.files?.policy?.[0];
    const estimateFile = req.files?.estimate?.[0];

    if (!policyFile) {
      return sendValidationError(res, 400, "Insurance policy PDF is required.");
    }

    if (!estimateFile) {
      return sendValidationError(res, 400, "Hospital estimate PDF is required.");
    }

    return next();
  });
};