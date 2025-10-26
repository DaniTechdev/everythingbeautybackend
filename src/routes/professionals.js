// import express from "express";
// import {
//   getProfessionals,
//   getProfessional,
//   createProfessionalProfile,
//   updateProfessionalProfile,
//   getMyProfessionalProfile,
//   getProfessionalsByLocation,
//   searchProfessionals,
// } from "../controllers/professionalsController.js";
// // import auth from "../middleware/auth.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Public routes
// router.get("/", getProfessionals);
// router.get("/search", searchProfessionals);
// router.get("/location", getProfessionalsByLocation);
// router.get("/:id", getProfessional);

// // Protected routes
// router.post("/", protect, createProfessionalProfile);
// router.put("/:id", protect, updateProfessionalProfile);
// router.get("/me/profile", protect, getMyProfessionalProfile);

// export default router;

import express from "express";
import {
  getProfessionals,
  getProfessional,
  updateProfessionalProfile,
  getMyProfessionalProfile,
  getProfessionalsByLocation,
  searchProfessionals,
} from "../controllers/professionalsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getProfessionals);
router.get("/search", searchProfessionals);
router.get("/location", getProfessionalsByLocation);
router.get("/:id", getProfessional);

// Protected routes
// REMOVED: router.post("/", protect, createProfessionalProfile);
// Professional profiles are now created automatically during user registration
router.put("/:id", protect, updateProfessionalProfile);
router.get("/me/profile", protect, getMyProfessionalProfile);

export default router;
