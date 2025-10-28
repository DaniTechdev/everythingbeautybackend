import User from "../models/users.js";

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      phone,
      location,
      bio,
      businessName,
      specialty,
      description,
      yearsExperience,
      socialMedia,
    } = req.body;

    console.log("Updating user profile:", { userId, updateData: req.body });

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update basic user fields
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    // Update business-specific fields for vendors
    if (user.role === "hair_vendor" && businessName !== undefined) {
      updateData.businessName = businessName;
    }

    // Update professional-specific fields
    if (["hair_dresser", "nail_technician"].includes(user.role)) {
      // Initialize professionalProfile if it doesn't exist
      if (!user.professionalProfile) {
        user.professionalProfile = user.getDefaultProfessionalProfile();
        await user.save();
      }

      const professionalUpdates = {};
      if (businessName !== undefined)
        professionalUpdates.businessName = businessName;
      if (specialty !== undefined) professionalUpdates.specialty = specialty;
      if (description !== undefined)
        professionalUpdates.description = description;
      if (yearsExperience !== undefined)
        professionalUpdates.yearsExperience = yearsExperience;
      if (socialMedia !== undefined)
        professionalUpdates.socialMedia = socialMedia;

      // Merge professional profile updates
      updateData.professionalProfile = {
        ...user.professionalProfile.toObject(),
        ...professionalUpdates,
      };
    }

    console.log("Final update data:", updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};
