import express from "express";
import {
  addToCart,
  getCartProducts,
  removeFromCart,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
  cartSchemas,
} from "../middleware/validateInput.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, validateBody(cartSchemas.add), addToCart);
router.delete(
  "/",
  protectRoute,
  validateBody(cartSchemas.remove),
  removeFromCart
);
router.delete("/all", protectRoute, removeAllFromCart);
router.put(
  "/:id",
  protectRoute,
  validateBody(cartSchemas.update),
  updateQuantity
);

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
