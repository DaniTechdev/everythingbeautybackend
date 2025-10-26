import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },

    service: {
      type: String,
      required: [true, "Service name is required"],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    response: {
      comment: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Index for professional ratings
reviewSchema.index({ professional: 1, rating: -1 });

export default mongoose.model("Review", reviewSchema);
