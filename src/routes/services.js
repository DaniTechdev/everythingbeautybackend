import express from "express";
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-services", getMyServices);
router.post("/", createService);
router.put("/:serviceId", updateService);
router.delete("/:serviceId", deleteService);
router.patch("/:serviceId/toggle-status", toggleServiceStatus);

export default router;
