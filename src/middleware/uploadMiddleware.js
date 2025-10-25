import multer from "multer";
import path from "path";

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for multiple document uploads
export const uploadDocuments = upload.fields([
  { name: "cacCertificate", maxCount: 1 },
  { name: "businessProof", maxCount: 1 },
  { name: "idDocument", maxCount: 1 },
]);

// Middleware for single file uploads (for portfolio)
export const uploadSingle = upload.single("file");
