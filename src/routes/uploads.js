import express from "express";
import {
  uploadDocuments,
  deleteDocument,
  uploadProfileImage,
  uploadCoverImage,
  uploadProductImages,
  setPrimaryProductImage,
  deleteProductImage,
  uploadPortfolioImages,
} from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadDocuments as uploadDocsMiddleware,
  uploadSingle,
  uploadMultiple,
} from "../middleware/uploadMiddleware.js";
import {
  deleteProfileImage,
  deleteCoverImage,
} from "../controllers/uploadController.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Document upload routes (existing)
router.post("/documents", uploadDocsMiddleware, uploadDocuments);
router.delete("/documents/:documentType", deleteDocument);

// New image upload routes
router.post("/profile", uploadSingle, uploadProfileImage);
router.post("/cover", uploadSingle, uploadCoverImage);
router.post("/products/:productId", uploadMultiple, uploadProductImages);
router.patch("/products/:productId/primary/:imageId", setPrimaryProductImage);
router.delete("/products/:productId/images/:imageId", deleteProductImage);
router.post("/portfolio", uploadMultiple, uploadPortfolioImages);

router.delete("/profile", protect, deleteProfileImage);
router.delete("/cover", protect, deleteCoverImage);

export default router;
