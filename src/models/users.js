import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Basic Authentication
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    // Role and Basic Info
    role: {
      type: String,
      enum: [
        "customer",
        "hair_dresser",
        "nail_technician",
        "hair_vendor",
        "admin",
      ],
      required: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Vendor-specific fields
    businessName: {
      type: String,
      required: function () {
        return this.role === "hair_vendor";
      },
    },
    cacNumber: {
      type: String,
      required: function () {
        return this.role === "hair_vendor";
      },
    },

    // Vendor Verification System (Current Focus)
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "approved", "rejected"],
      default: "unverified",
    },
    verificationDocuments: {
      cacCertificate: {
        url: String,
        publicId: String,
        uploadedAt: Date,
      },
      businessProof: {
        url: String,
        publicId: String,
        uploadedAt: Date,
      },
      idDocument: {
        url: String,
        publicId: String,
        uploadedAt: Date,
      },
    },
    verificationNotes: String,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: String,

    // Professional-specific fields (Hair Dressers & Nail Technicians)
    bio: String,
    experience: Number,
    hasShop: Boolean,
    shopAddress: String,
    travelAreas: [String],
    portfolio: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],

    // Services (For Professionals)
    services: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Service name cannot exceed 100 characters"],
        },
        description: {
          type: String,
          maxlength: [300, "Service description cannot exceed 300 characters"],
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        duration: {
          type: Number, // in minutes
          required: true,
          min: 15,
          max: 480,
        },
        category: {
          type: String,
          required: true,
          enum: ["hair", "nails", "skincare", "makeup", "other"],
        },
        subcategory: {
          type: String,
          trim: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        featured: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Basic Ratings (For Future)
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    // Profile Image
    profileImage: {
      url: String,
      publicId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model("User", userSchema);
