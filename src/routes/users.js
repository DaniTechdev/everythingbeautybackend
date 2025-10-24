import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected user routes will go here
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
