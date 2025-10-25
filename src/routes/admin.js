import express from "express";
import {
  getPendingVerifications,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  getVerificationStats,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

router.get("/verifications/pending", getPendingVerifications);
router.get("/verifications/stats", getVerificationStats);
router.get("/vendors/:vendorId", getVendorDetails);
router.post("/vendors/:vendorId/approve", approveVendor);
router.post("/vendors/:vendorId/reject", rejectVendor);

export default router;
