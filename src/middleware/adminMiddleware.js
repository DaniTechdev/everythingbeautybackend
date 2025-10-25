import User from "../models/users.js";

export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Server error in admin verification",
    });
  }
};
