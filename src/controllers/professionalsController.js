import User from "../models/users.js";

// Get all professionals with filtering
export const getProfessionals = async (req, res) => {
  try {
    const {
      category,
      service,
      location,
      minRating,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    // Build query
    const query = {
      isActive: true,
      role: { $in: ["hair_dresser", "nail_technician"] },
    };

    // Category filter
    if (category) {
      if (category === "hair_dresser") query.role = "hair_dresser";
      if (category === "nail_technician") query.role = "nail_technician";
    }

    // Service filter
    if (service) {
      query["professionalProfile.services.name"] = new RegExp(service, "i");
    }

    // Location filter
    if (location) {
      query.location = new RegExp(location, "i");
    }

    // Rating filter
    if (minRating) {
      query["rating.average"] = { $gte: parseFloat(minRating) };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { "professionalProfile.businessName": new RegExp(search, "i") },
        { "professionalProfile.specialty": new RegExp(search, "i") },
        { "professionalProfile.description": new RegExp(search, "i") },
        { "professionalProfile.services.name": new RegExp(search, "i") },
      ];
    }

    // Execute query
    const professionals = await User.find(query)
      .select(
        "-password -verificationDocuments -verificationNotes -rejectionReason"
      )
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ "rating.average": -1, "rating.count": -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    // Use the new method for consistent data structure
    const professionalData = professionals
      .filter((user) => user.isProfessional)
      .map((user) => user.getProfessionalData());

    res.json({
      success: true,
      professionals: professionalData,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Get professionals error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch professionals",
    });
  }
};

// Get single professional
export const getProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await User.findOne({
      _id: id,
      role: { $in: ["hair_dresser", "nail_technician"] },
      isActive: true,
    }).select(
      "-password -verificationDocuments -verificationNotes -rejectionReason"
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: "Professional not found",
      });
    }

    // Get reviews (to be implemented later)
    const reviews = await getProfessionalReviews(id);

    const professionalData = professional.getProfessionalData();
    professionalData.reviews = reviews;

    res.json({
      success: true,
      professional: professionalData,
    });
  } catch (error) {
    console.error("Get professional error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch professional",
    });
  }
};

// Update professional profile
export const updateProfessionalProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check ownership
    if (id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const professional = await User.findOne({
      _id: id,
      role: { $in: ["hair_dresser", "nail_technician"] },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    // Update professionalProfile specifically
    const updateData = {};
    if (req.body.professionalProfile) {
      updateData.professionalProfile = {
        ...professional.professionalProfile.toObject(),
        ...req.body.professionalProfile,
      };
    }

    const updatedProfessional = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Professional profile updated successfully",
      professional: updatedProfessional.getProfessionalData(),
    });
  } catch (error) {
    console.error("Update professional profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update professional profile",
    });
  }
};

// Get professional's own profile
export const getMyProfessionalProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const professional = await User.findOne({
      _id: userId,
      role: { $in: ["hair_dresser", "nail_technician"] },
    }).select("-password");

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    res.json({
      success: true,
      professional: professional.getProfessionalData(),
    });
  } catch (error) {
    console.error("Get my professional profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch professional profile",
    });
  }
};

// Search professionals
export const searchProfessionals = async (req, res) => {
  try {
    const { q, location, category, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const query = {
      isActive: true,
      role: { $in: ["hair_dresser", "nail_technician"] },
      $or: [
        { name: new RegExp(q, "i") },
        { "professionalProfile.businessName": new RegExp(q, "i") },
        { "professionalProfile.specialty": new RegExp(q, "i") },
        { "professionalProfile.description": new RegExp(q, "i") },
        { "professionalProfile.services.name": new RegExp(q, "i") },
      ],
    };

    if (location) {
      query.location = new RegExp(location, "i");
    }

    if (category) {
      query.role = category;
    }

    const professionals = await User.find(query)
      .select("name professionalProfile role rating location profileImage")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ "rating.average": -1, "rating.count": -1 });

    const total = await User.countDocuments(query);

    const professionalData = professionals
      .filter((user) => user.isProfessional)
      .map((user) => user.getProfessionalData());

    res.json({
      success: true,
      professionals: professionalData,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Search professionals error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search professionals",
    });
  }
};

// Get professionals by location
export const getProfessionalsByLocation = async (req, res) => {
  try {
    const { location, limit = 10 } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: "Location is required",
      });
    }

    const professionals = await User.find({
      location: new RegExp(location, "i"),
      role: { $in: ["hair_dresser", "nail_technician"] },
      isActive: true,
    })
      .select("name professionalProfile role rating location profileImage")
      .limit(parseInt(limit))
      .sort({ "rating.average": -1, "rating.count": -1 });

    const professionalData = professionals
      .filter((user) => user.isProfessional)
      .map((user) => user.getProfessionalData());

    res.json({
      success: true,
      professionals: professionalData,
    });
  } catch (error) {
    console.error("Get professionals by location error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch professionals by location",
    });
  }
};

// Helper function for reviews
const getProfessionalReviews = async (professionalId) => {
  // To be implemented when Review model is created
  return [];
};
