import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Service sub-schema (moved from main schema)
const serviceSchema = new mongoose.Schema({
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
});

// Portfolio sub-schema
const portfolioSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  caption: String,
  category: String,
});

// Business Hours sub-schema
const businessHoursSchema = new mongoose.Schema({
  monday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  tuesday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  wednesday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  thursday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  friday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  saturday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  sunday: {
    open: String,
    close: String,
    closed: { type: Boolean, default: true },
  },
});

// Professional Profile sub-schema
const professionalProfileSchema = new mongoose.Schema({
  businessName: {
    type: String,
    trim: true,
  },
  specialty: {
    type: String,
    trim: true,
    maxlength: [100, "Specialty cannot exceed 100 characters"],
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  businessHours: businessHoursSchema,
  coverImage: {
    url: String,
    publicId: String,
  },
  averageResponseTime: {
    type: String,
    default: "Within 24 hours",
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    tiktok: String,
  },
  // Services and portfolio moved here from main schema
  services: [serviceSchema],
  portfolio: [portfolioSchema],
  // Additional professional fields
  yearsExperience: {
    type: Number,
    min: 0,
  },
  certifications: [
    {
      name: String,
      issuer: String,
      year: Number,
    },
  ],
  awards: [
    {
      name: String,
      year: Number,
      description: String,
    },
  ],
  // Professional settings
  acceptsNewClients: {
    type: Boolean,
    default: true,
  },
  travelRadius: {
    type: Number, // in kilometers
    default: 0,
  },
  travelFee: {
    type: Number,
    default: 0,
  },
});

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

    // Vendor-specific fields (remain in main schema)
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

    // Vendor Verification System
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

    // Professional Profile (NEW - for hair_dresser and nail_technician)
    professionalProfile: professionalProfileSchema,

    // Basic professional fields (kept for backward compatibility during migration)
    bio: String,
    experience: Number,
    hasShop: Boolean,
    shopAddress: String,
    travelAreas: [String],

    // Basic Ratings
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

// Auto-create professionalProfile for professional roles
userSchema.pre("save", function (next) {
  if (
    ["hair_dresser", "nail_technician"].includes(this.role) &&
    !this.professionalProfile
  ) {
    this.professionalProfile = this.getDefaultProfessionalProfile();
  }
  next();
});

// Method to get default professional profile
userSchema.methods.getDefaultProfessionalProfile = function () {
  const defaultBusinessHours = {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "20:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "", close: "", closed: true },
  };

  return {
    businessName: this.businessName || this.name,
    specialty:
      this.bio ||
      `${
        this.role === "hair_dresser" ? "Hair Styling" : "Nail Care"
      } Professional`,
    description: this.bio || `Professional ${this.role}`,
    businessHours: defaultBusinessHours,
    averageResponseTime: "Within 24 hours",
    yearsExperience: this.experience || 1,
    acceptsNewClients: true,
    travelRadius: 0,
    travelFee: 0,
  };
};

// Virtual for checking if user is a professional
userSchema.virtual("isProfessional").get(function () {
  return ["hair_dresser", "nail_technician"].includes(this.role);
});

// Method to get professional data for API responses
userSchema.methods.getProfessionalData = function () {
  if (!this.isProfessional) return null;

  return {
    _id: this._id,
    businessName: this.professionalProfile?.businessName || this.name,
    professionalType: this.role,
    specialty: this.professionalProfile?.specialty,
    description: this.professionalProfile?.description,
    rating: this.rating?.average || 0,
    reviewCount: this.rating?.count || 0,
    location: this.location,
    address: this.shopAddress || this.location,
    phone: this.phone,
    email: this.email,
    services: this.professionalProfile?.services || [],
    portfolio: this.professionalProfile?.portfolio || [],
    businessHours: this.professionalProfile?.businessHours,
    isVerified: this.verificationStatus === "approved",
    isActive: this.isActive,
    yearsExperience: this.professionalProfile?.yearsExperience,
    profileImage: this.profileImage,
    coverImage: this.professionalProfile?.coverImage,
    averageResponseTime: this.professionalProfile?.averageResponseTime,
    // Include other professional profile fields
    socialMedia: this.professionalProfile?.socialMedia,
    certifications: this.professionalProfile?.certifications,
    awards: this.professionalProfile?.awards,
    acceptsNewClients: this.professionalProfile?.acceptsNewClients,
    travelRadius: this.professionalProfile?.travelRadius,
    travelFee: this.professionalProfile?.travelFee,
  };
};

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
