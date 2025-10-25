import express from "express";
import {
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
  deleteProductImage,
  getProductStats,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { vendorOnly } from "../middleware/vendorMiddleware.js";
import { uploadMultiple } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(vendorOnly);

router.get("/", getMyProducts);
router.get("/stats", getProductStats);
router.get("/:productId", getProduct);
router.post("/", createProduct);
router.put("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);
router.patch("/:productId/status", updateProductStatus);
router.post("/:productId/images", uploadMultiple, uploadProductImages);
router.delete("/:productId/images/:imageId", deleteProductImage);

export default router;
