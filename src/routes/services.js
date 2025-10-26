import express from "express";
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getFeaturedServices,
  reorderServices,
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-services", getMyServices);
router.post("/", createService);
router.put("/:serviceId", updateService);
router.delete("/:serviceId", deleteService);
router.patch("/:serviceId/toggle-status", toggleServiceStatus);
router.get("/:professionalId/featured", getFeaturedServices); // Public route
router.put("/reorder", protect, reorderServices);
export default router;
