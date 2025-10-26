// import User from "../models/users.js";

// // Get services for a professional
// export const getMyServices = async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select("services");

//     res.json({
//       success: true,
//       services: user.services || [],
//     });
//   } catch (error) {
//     console.error("Get services error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch services",
//     });
//   }
// };

// // Create a new service
// export const createService = async (req, res) => {
//   try {
//     const { name, description, price, duration, category, subcategory } =
//       req.body;

//     const user = await User.findById(req.userId);

//     console.log("user:", user);

//     // Check if user is a professional
//     if (!["hair_dresser", "nail_technician"].includes(user.role)) {
//       return res.status(403).json({
//         success: false,
//         error: "Only professionals can create services",
//       });
//     }

//     const newService = {
//       name,
//       description,
//       price,
//       duration,
//       category,
//       subcategory,
//       createdAt: new Date(),
//     };

//     user.services.push(newService);
//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: "Service created successfully",
//       service: newService,
//     });
//   } catch (error) {
//     console.error("Create service error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create service",
//     });
//   }
// };

// // Update a service
// export const updateService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const updates = req.body;

//     const user = await User.findById(req.userId);

//     const serviceIndex = user.services.findIndex(
//       (service) => service._id.toString() === serviceId
//     );

//     if (serviceIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         error: "Service not found",
//       });
//     }

//     // Update service fields
//     Object.keys(updates).forEach((key) => {
//       if (updates[key] !== undefined) {
//         user.services[serviceIndex][key] = updates[key];
//       }
//     });

//     await user.save();

//     res.json({
//       success: true,
//       message: "Service updated successfully",
//       service: user.services[serviceIndex],
//     });
//   } catch (error) {
//     console.error("Update service error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update service",
//     });
//   }
// };

// // Delete a service
// export const deleteService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     const user = await User.findById(req.userId);

//     const serviceIndex = user.services.findIndex(
//       (service) => service._id.toString() === serviceId
//     );

//     if (serviceIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         error: "Service not found",
//       });
//     }

//     user.services.splice(serviceIndex, 1);
//     await user.save();

//     res.json({
//       success: true,
//       message: "Service deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete service error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to delete service",
//     });
//   }
// };

// // Toggle service status (active/inactive)
// export const toggleServiceStatus = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     const user = await User.findById(req.userId);

//     const service = user.services.find(
//       (service) => service._id.toString() === serviceId
//     );

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         error: "Service not found",
//       });
//     }

//     service.isActive = !service.isActive;
//     await user.save();

//     res.json({
//       success: true,
//       message: `Service ${
//         service.isActive ? "activated" : "deactivated"
//       } successfully`,
//       service,
//     });
//   } catch (error) {
//     console.error("Toggle service status error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update service status",
//     });
//   }
// };

import User from "../models/users.js";

// Get services for a professional
export const getMyServices = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("professionalProfile");

    if (!user || !user.professionalProfile) {
      return res.json({
        success: true,
        services: [],
      });
    }

    res.json({
      success: true,
      services: user.professionalProfile.services || [],
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
};

// Create a new service
export const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      category,
      subcategory,
      featured = false,
    } = req.body;

    const user = await User.findById(req.userId);

    // Check if user is a professional
    if (!["hair_dresser", "nail_technician"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Only professionals can create services",
      });
    }

    // Ensure professionalProfile exists
    if (!user.professionalProfile) {
      user.professionalProfile = user.getDefaultProfessionalProfile();
    }

    const newService = {
      name,
      description,
      price,
      duration,
      category,
      subcategory,
      featured,
      isActive: true,
      createdAt: new Date(),
    };

    // Add to professionalProfile.services instead of user.services
    user.professionalProfile.services.push(newService);
    await user.save();

    // Get the newly created service with its _id
    const createdService =
      user.professionalProfile.services[
        user.professionalProfile.services.length - 1
      ];

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: createdService,
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create service",
    });
  }
};

// Update a service
export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.userId);

    // Check if user has professionalProfile
    if (!user.professionalProfile) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    const serviceIndex = user.professionalProfile.services.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    // Update service fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "_id") {
        user.professionalProfile.services[serviceIndex][key] = updates[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Service updated successfully",
      service: user.professionalProfile.services[serviceIndex],
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update service",
    });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const user = await User.findById(req.userId);

    // Check if user has professionalProfile
    if (!user.professionalProfile) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    const serviceIndex = user.professionalProfile.services.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    user.professionalProfile.services.splice(serviceIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete service",
    });
  }
};

// Toggle service status (active/inactive)
export const toggleServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const user = await User.findById(req.userId);

    // Check if user has professionalProfile
    if (!user.professionalProfile) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    const service = user.professionalProfile.services.find(
      (service) => service._id.toString() === serviceId
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    service.isActive = !service.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Service ${
        service.isActive ? "activated" : "deactivated"
      } successfully`,
      service,
    });
  } catch (error) {
    console.error("Toggle service status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update service status",
    });
  }
};

// Get featured services for a professional
export const getFeaturedServices = async (req, res) => {
  try {
    const { professionalId } = req.params;

    const professional = await User.findOne({
      _id: professionalId,
      role: { $in: ["hair_dresser", "nail_technician"] },
      isActive: true,
    }).select("professionalProfile");

    if (!professional || !professional.professionalProfile) {
      return res.json({
        success: true,
        services: [],
      });
    }

    const featuredServices = professional.professionalProfile.services.filter(
      (service) => service.featured && service.isActive
    );

    res.json({
      success: true,
      services: featuredServices,
    });
  } catch (error) {
    console.error("Get featured services error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured services",
    });
  }
};

// Reorder services
export const reorderServices = async (req, res) => {
  try {
    const { serviceIds } = req.body; // Array of service IDs in new order

    const user = await User.findById(req.userId);

    // Check if user has professionalProfile
    if (!user.professionalProfile) {
      return res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
    }

    // Create a new array with services in the specified order
    const reorderedServices = [];
    const currentServices = user.professionalProfile.services;

    for (const serviceId of serviceIds) {
      const service = currentServices.find(
        (s) => s._id.toString() === serviceId
      );
      if (service) {
        reorderedServices.push(service);
      }
    }

    // Add any remaining services that weren't in the reorder list
    const remainingServices = currentServices.filter(
      (service) => !serviceIds.includes(service._id.toString())
    );

    user.professionalProfile.services = [
      ...reorderedServices,
      ...remainingServices,
    ];
    await user.save();

    res.json({
      success: true,
      message: "Services reordered successfully",
      services: user.professionalProfile.services,
    });
  } catch (error) {
    console.error("Reorder services error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reorder services",
    });
  }
};
