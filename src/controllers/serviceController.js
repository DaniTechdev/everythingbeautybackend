import User from "../models/users.js";

// Get services for a professional
export const getMyServices = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("services");

    res.json({
      success: true,
      services: user.services || [],
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
    const { name, description, price, duration, category, subcategory } =
      req.body;

    const user = await User.findById(req.userId);

    // Check if user is a professional
    if (!["hair_dresser", "nail_technician"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Only professionals can create services",
      });
    }

    const newService = {
      name,
      description,
      price,
      duration,
      category,
      subcategory,
      createdAt: new Date(),
    };

    user.services.push(newService);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: newService,
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

    const serviceIndex = user.services.findIndex(
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
      if (updates[key] !== undefined) {
        user.services[serviceIndex][key] = updates[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Service updated successfully",
      service: user.services[serviceIndex],
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

    const serviceIndex = user.services.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    user.services.splice(serviceIndex, 1);
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

    const service = user.services.find(
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
