import User from "../models/users.js";
// import User from "../models/users.js";

export const vendorOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.role !== "hair_vendor") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Vendor privileges required.",
      });
    }

    if (user.verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        error: "Vendor account must be verified to access this resource.",
      });
    }

    next();
  } catch (error) {
    console.error("Vendor middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Server error in vendor verification",
    });
  }
};
