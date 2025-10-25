import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Basic Product Information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },

    // Inventory & Stock
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    allowOutOfStockPurchase: {
      type: Boolean,
      default: false,
    },

    // Product Categorization
    category: {
      type: String,
      required: true,
      enum: [
        "braiding_hair",
        "weaving_hair",
        "closures",
        "frontals",
        "wigs",
        "hair_care",
        "tools",
        "accessories",
        "other",
      ],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Product Specifications
    brand: {
      type: String,
      trim: true,
    },
    hairType: {
      type: String,
      enum: ["synthetic", "human_hair", "mixed", "other"],
    },
    hairTexture: {
      type: String,
      enum: [
        "straight",
        "wavy",
        "curly",
        "kinky",
        "body_wave",
        "loose_wave",
        "deep_wave",
        "other",
      ],
    },
    hairLength: {
      type: String, // e.g., "14 inches", "16-18 inches"
    },
    hairColor: {
      type: String,
    },
    weight: {
      type: String, // e.g., "100g", "200g"
    },

    // Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Vendor Information
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },

    // Product Status
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "out_of_stock", "discontinued"],
      default: "draft",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },

    // SEO & Discovery
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    metaTitle: String,
    metaDescription: String,

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },

    // Shipping & Handling
    weightInGrams: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },

    // Variants
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: [
      {
        name: String,
        sku: String,
        price: Number,
        comparePrice: Number,
        stock: Number,
        weight: String,
        color: String,
        length: String,
        images: [
          {
            url: String,
            publicId: String,
          },
        ],
      },
    ],

    // Timestamps
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, isPublished: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ tags: 1 });

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(
      ((this.comparePrice - this.price) / this.comparePrice) * 100
    );
  }
  return 0;
});

// Virtual for in stock status
productSchema.virtual("inStock").get(function () {
  if (!this.trackQuantity) return true;
  return this.stock > 0 || this.allowOutOfStockPurchase;
});

// Pre-save middleware to generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  }
  next();
});

// Static method to get products by vendor
productSchema.statics.findByVendor = function (vendorId, status = "active") {
  return this.find({
    vendor: vendorId,
    status: status,
    isPublished: true,
  }).sort({ createdAt: -1 });
};

// Static method to get products by category
productSchema.statics.findByCategory = function (category, limit = 20) {
  return this.find({
    category,
    status: "active",
    isPublished: true,
    stock: { $gt: 0 },
  })
    .limit(limit)
    .sort({ featured: -1, createdAt: -1 });
};

export default mongoose.model("Product", productSchema);
