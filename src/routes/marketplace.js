import express from "express";
import Product from "../models/Product.js";
import User from "../models/users.js";

const router = express.Router();

// GET /api/marketplace/products - Public product listing
router.get("/products", async (req, res) => {
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
});

// GET /api/marketplace/products/:id - Single product details
router.get("/products/:id", async (req, res) => {
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
});

// GET /api/marketplace/vendors - List all verified vendors
router.get("/vendors", async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;

    const filter = {
      role: "vendor",
      isVerified: true,
      vendorStatus: "approved",
    };

    if (search) {
      filter.businessName = { $regex: search, $options: "i" };
    }

    const vendors = await User.find(filter)
      .select(
        "businessName profileImage rating reviewCount description location"
      )
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      vendors,
      pagination: {
        current: page,
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
});

// GET /api/marketplace/vendors/:id - Single vendor store page
router.get("/vendors/:id", async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id)
      .select(
        "businessName profileImage coverImage rating reviewCount description location contactInfo businessHours"
      )
      .exec();

    if (!vendor || vendor.role !== "vendor" || !vendor.isVerified) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    // Get vendor's active products
    const products = await Product.find({
      vendor: req.params.id,
      status: "active",
      isPublished: true,
    }).sort({ featured: -1, createdAt: -1 });

    res.json({
      success: true,
      vendor: {
        ...vendor.toObject(),
        productCount: products.length,
      },
      products,
    });
  } catch (error) {
    console.error("Get vendor error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor",
    });
  }
});

// GET /api/marketplace/categories - Product categories
router.get("/categories", async (req, res) => {
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
});

// GET /api/marketplace/search - Search products and vendors
router.get("/search", async (req, res) => {
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
});

export default router;
