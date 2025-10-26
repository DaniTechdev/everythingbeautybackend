import User from "../models/users.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// GET /api/marketplace/vendors - Get all verified hair vendors
export const getVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      sortBy = "rating",
      location,
    } = req.query;

    // Build filter for verified hair vendors
    const filter = {
      role: "hair_vendor",
      isVerified: true,
      verificationStatus: "approved",
      isActive: true,
    };

    // Search filter
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
      ];
    }

    // Location filter
    if (location && location !== "all") {
      filter.location = { $regex: location, $options: "i" };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case "newest":
        sortOptions.createdAt = -1;
        break;
      case "name":
        sortOptions.businessName = 1;
        break;
      case "reviewCount":
        sortOptions.reviewCount = -1;
        break;
      case "products":
        // We'll handle this after getting vendors
        break;
      case "rating":
      default:
        sortOptions.rating = -1;
        break;
    }

    // Execute query
    let vendors = await User.find(filter)
      .select(
        "name email phone role location isVerified verificationStatus businessName description specialty profileImage coverImage rating reviewCount yearsExperience createdAt socialMedia"
      )
      .sort(sortBy === "products" ? { createdAt: -1 } : sortOptions) // Default sort for products case
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    // If sorting by product count, we need to get product counts first
    if (sortBy === "products") {
      const vendorsWithProductCounts = await Promise.all(
        vendors.map(async (vendor) => {
          const productCount = await Product.countDocuments({
            vendor: vendor._id,
            status: "active",
            isPublished: true,
          });
          return { ...vendor, productCount };
        })
      );

      // Sort by product count
      vendors = vendorsWithProductCounts.sort(
        (a, b) => b.productCount - a.productCount
      );
    } else {
      // Add product counts for all vendors
      vendors = await Promise.all(
        vendors.map(async (vendor) => {
          const productCount = await Product.countDocuments({
            vendor: vendor._id,
            status: "active",
            isPublished: true,
          });
          return { ...vendor, productCount };
        })
      );
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      vendors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get vendors error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendors",
    });
  }
};

// GET /api/marketplace/vendors/:id - Get single vendor with products
export const getVendor = async (req, res) => {
  try {
    const vendor = await User.findOne({
      _id: req.params.id,
      role: "hair_vendor",
      isVerified: true,
      verificationStatus: "approved",
    })
      .select(
        "name email phone role location isVerified verificationStatus businessName description specialty profileImage coverImage rating reviewCount yearsExperience createdAt socialMedia businessHours cacNumber verificationDocuments"
      )
      .lean()
      .exec();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found or not approved",
      });
    }

    // Get vendor's active products
    const products = await Product.find({
      vendor: req.params.id,
      status: "active",
      isPublished: true,
    })
      .populate("vendor", "businessName profileImage isVerified")
      .sort({ featured: -1, createdAt: -1 })
      .lean()
      .exec();

    // Get product count by category for vendor stats
    const categoryStats = await Product.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(req.params.id),
          status: "active",
          isPublished: true,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get vendor stats
    const totalProducts = products.length;
    const featuredProducts = products.filter((p) => p.featured).length;
    const totalInventory = products.reduce(
      (sum, product) => sum + (product.stock || 0),
      0
    );

    const vendorWithStats = {
      ...vendor,
      stats: {
        totalProducts,
        featuredProducts,
        totalInventory,
        // categories: categoryStats.length,
      },
      //   categoryStats,
    };

    res.json({
      success: true,
      vendor: vendorWithStats,
      products,
    });
  } catch (error) {
    console.error("Get vendor error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor",
    });
  }
};

// GET /api/marketplace/vendors/:id/products - Get vendor's products with filters
export const getVendorProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      hairType,
      minPrice,
      maxPrice,
      sortBy = "newest",
    } = req.query;

    // Verify vendor exists and is approved
    const vendor = await User.findOne({
      _id: req.params.id,
      role: "hair_vendor",
      isVerified: true,
      verificationStatus: "approved",
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    // Build product filter
    const filter = {
      vendor: req.params.id,
      status: "active",
      isPublished: true,
    };

    // Additional filters
    if (category && category !== "all") {
      filter.category = category;
    }

    if (hairType && hairType !== "all") {
      filter.hairType = hairType;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case "price-low":
        sortOptions.price = 1;
        break;
      case "price-high":
        sortOptions.price = -1;
        break;
      case "popular":
        sortOptions.viewCount = -1;
        break;
      case "name":
        sortOptions.name = 1;
        break;
      case "newest":
      default:
        sortOptions.createdAt = -1;
        break;
    }

    // Execute query
    const products = await Product.find(filter)
      .populate("vendor", "businessName profileImage isVerified")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
        profileImage: vendor.profileImage,
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get vendor products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor products",
    });
  }
};

// GET /api/marketplace/vendors/search - Search vendors
export const searchVendors = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters long",
      });
    }

    const vendors = await User.find({
      role: "hair_vendor",
      isVerified: true,
      verificationStatus: "approved",
      $or: [
        { businessName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { specialty: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    })
      .select(
        "businessName profileImage rating reviewCount location description"
      )
      .limit(parseInt(limit))
      .sort({ rating: -1, reviewCount: -1 })
      .lean()
      .exec();

    // Add product counts
    const vendorsWithCounts = await Promise.all(
      vendors.map(async (vendor) => {
        const productCount = await Product.countDocuments({
          vendor: vendor._id,
          status: "active",
          isPublished: true,
        });
        return { ...vendor, productCount };
      })
    );

    res.json({
      success: true,
      vendors: vendorsWithCounts,
      query: q,
    });
  } catch (error) {
    console.error("Search vendors error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
};

// GET /api/marketplace/vendors/locations - Get unique vendor locations
export const getVendorLocations = async (req, res) => {
  try {
    const locations = await User.distinct("location", {
      role: "hair_vendor",
      isVerified: true,
      verificationStatus: "approved",
    });

    // Get counts for each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const count = await User.countDocuments({
          role: "hair_vendor",
          isVerified: true,
          verificationStatus: "approved",
          location,
        });
        return {
          name: location,
          count,
        };
      })
    );

    res.json({
      success: true,
      locations: locationsWithCounts.sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.error("Get vendor locations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor locations",
    });
  }
};

// GET /api/marketplace/products - Public product listing

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      hairType,
      hairTexture,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {
      status: "active",
      isPublished: true,
      $or: [
        { trackQuantity: false },
        { trackQuantity: true, stock: { $gt: 0 } },
        { allowOutOfStockPurchase: true },
      ],
    };

    // Category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // Hair type filter
    if (hairType && hairType !== "all") {
      filter.hairType = hairType;
    }

    // Hair texture filter
    if (hairTexture && hairTexture !== "all") {
      filter.hairTexture = hairTexture;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const products = await Product.find(filter)
      .populate("vendor", "businessName profileImage isVerified")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate(
        "vendor",
        "businessName profileImage isVerified rating reviewCount"
      )
      .exec();

    if (!product || product.status !== "active" || !product.isPublished) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q, type = "products" } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    if (type === "products") {
      const products = await Product.find({
        $and: [
          {
            $or: [
              { name: { $regex: q, $options: "i" } },
              { description: { $regex: q, $options: "i" } },
              { brand: { $regex: q, $options: "i" } },
              { tags: { $in: [new RegExp(q, "i")] } },
            ],
          },
          { status: "active", isPublished: true },
        ],
      })
        .populate("vendor", "businessName profileImage isVerified")
        .limit(10)
        .exec();

      res.json({
        success: true,
        results: products,
        type: "products",
      });
    } else if (type === "vendors") {
      const vendors = await User.find({
        businessName: { $regex: q, $options: "i" },
        role: "vendor",
        isVerified: true,
      })
        .select("businessName profileImage rating reviewCount location")
        .limit(10)
        .exec();

      res.json({
        success: true,
        results: vendors,
        type: "vendors",
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      status: "active",
      isPublished: true,
    });

    const categoryCounts = await Product.aggregate([
      {
        $match: {
          status: "active",
          isPublished: true,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      categories: categories.map((cat) => ({
        name: cat,
        count: categoryCounts.find((c) => c._id === cat)?.count || 0,
      })),
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};
