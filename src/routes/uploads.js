import express from "express";
import {
  uploadDocuments,
  deleteDocument,
} from "../controllers/uploadController.js";
// import { protect } from "../middleware/authMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
// import { uploadDocuments as uploadMiddleware } from "../middleware/uploadMiddleware.js";
import { uploadDocuments as uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/documents", protect, uploadMiddleware, uploadDocuments);
router.delete("/documents/:documentType", protect, deleteDocument);

export default router;
