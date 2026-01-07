import Visitor from "../models/visitors.model.js";

export const visitorsTracker = async (req, res) => {
  try {
    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Visitor.findOne({
      ipAddress,
      createdAt: { $gte: today },
    });

    if (existing) {
      return res.status(200).json({ message: "Visitor already logged today" });
    }
    await Visitor.create({ ipAddress, userAgent });

    res.status(201).json({ message: "Visitor recorded" });
  } catch (error) {
    console.error(" Visitor logging error:", error);
    res.status(500).json({ message: "Error logging visitor" });
  }
}; 