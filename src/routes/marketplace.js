import express from "express";
import {
  getVendors,
  getVendor,
  getVendorProducts,
  searchVendors,
  getVendorLocations,
  getProducts,
  getProduct,
  getCategories,
  searchProducts,
} from "../controllers/vendorController.js";

const router = express.Router();

// Vendor routes
router.get("/vendors", getVendors);
router.get("/vendors/search", searchVendors);
router.get("/vendors/locations", getVendorLocations);
router.get("/vendors/:id", getVendor);
router.get("/vendors/:id/products", getVendorProducts);

// Product routes (keep your existing ones)
router.get("/products", getProducts);
router.get("/products/search", searchProducts);
router.get("/products/:id", getProduct);
router.get("/categories", getCategories);

export default router;
