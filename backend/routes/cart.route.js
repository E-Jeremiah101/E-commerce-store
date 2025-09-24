import express from "express";
import {
  addToCart,
  getCartProducts,
  removeFromCart,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeFromCart); // remove one item (with size+color)
router.delete("/all", protectRoute, removeAllFromCart); // clear all cart
router.put("/:id", protectRoute, updateQuantity);

export default router;





































// import express from "express";
// import {
//   addToCart,
//   getCartProducts,
//   removeAllFromCart,
//   updateQuantity,
// } from "../controllers/cart.controller.js";
// import { protectRoute } from "../middleware/auth.middleware.js";

// const router = express.Router();

// router.get("/", protectRoute, getCartProducts);
// router.post("/", protectRoute, addToCart);
// router.delete("/", protectRoute, removeAllFromCart);
// router.put("/:id", protectRoute, updateQuantity);

// export default router;
