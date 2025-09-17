import Order from "../models/order.model.js";

export const getUserOrders = async (req, res) => {
    try {
        const userId =  req.user._id;

        const orders = await Order.find({user: userId}).populate("products.product", "name image price").sort({createdAt: -1});

        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Get all orders (for admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email") // show user info
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    if (status === "delivered") order.deliveredAt = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};