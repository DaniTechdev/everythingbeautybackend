// // routes/cart.js
// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import {
//   getCart,
//   addToCart,
//   updateCartItem,
//   removeFromCart,
//   clearCart,
// } from "../controllers/cartController.js";

// const router = express.Router();

// router.use(protect); // All cart routes require authentication

// router.route("/add").get(getCart).post(addToCart).delete(clearCart);

// router.route("/:itemId").put(updateCartItem).delete(removeFromCart);

// export default router;

// routes/cart.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.use(protect); // All cart routes require authentication

// Fix: Separate endpoints for better RESTful structure
router.route("/").get(getCart).delete(clearCart);

router.route("/add").post(addToCart);

router.route("/:itemId").put(updateCartItem).delete(removeFromCart);

export default router;
