// import User from "../models/User.js";
import User from "../models/users.js";

// Get all pending vendor verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingVendors = await User.find({
      role: "hair_vendor",
      verificationStatus: "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vendors: pendingVendors,
      count: pendingVendors.length,
    });
  } catch (error) {
    console.error("Get pending verifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending verifications",
    });
  }
};

// Get vendor details for verification
export const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId)
      .select("-password")
      .populate("verifiedBy", "name email");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    res.json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error("Get vendor details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor details",
    });
  }
};

// Approve vendor verification
export const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { notes } = req.body;
    const adminId = req.userId;

    const vendor = await User.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    if (vendor.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Vendor is not pending verification",
      });
    }

    // Update vendor verification status
    vendor.verificationStatus = "approved";
    vendor.verifiedAt = new Date();
    vendor.verifiedBy = adminId;
    vendor.verificationNotes = notes;
    vendor.isVerified = true;

    await vendor.save();

    // TODO: Send approval email to vendor

    res.json({
      success: true,
      message: "Vendor approved successfully",
      vendor: await User.findById(vendorId).select("-password"),
    });
  } catch (error) {
    console.error("Approve vendor error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve vendor",
    });
  }
};

// Reject vendor verification
export const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.userId;

    const vendor = await User.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    if (vendor.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Vendor is not pending verification",
      });
    }

    // Update vendor verification status
    vendor.verificationStatus = "rejected";
    vendor.verifiedAt = new Date();
    vendor.verifiedBy = adminId;
    vendor.rejectionReason = reason;
    vendor.verificationNotes = notes;

    await vendor.save();

    // TODO: Send rejection email to vendor

    res.json({
      success: true,
      message: "Vendor rejected successfully",
      vendor: await User.findById(vendorId).select("-password"),
    });
  } catch (error) {
    console.error("Reject vendor error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject vendor",
    });
  }
};

// Get verification statistics
export const getVerificationStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { role: "hair_vendor" },
      },
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalVendors = await User.countDocuments({ role: "hair_vendor" });
    const pendingCount = await User.countDocuments({
      role: "hair_vendor",
      verificationStatus: "pending",
    });

    res.json({
      success: true,
      stats,
      totalVendors,
      pendingCount,
    });
  } catch (error) {
    console.error("Get verification stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch verification statistics",
    });
  }
};
