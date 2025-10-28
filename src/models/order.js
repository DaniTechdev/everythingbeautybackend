import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Enhanced for multi-vendor support
    vendorOrders: [
      {
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        vendorBusinessName: String,
        items: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
              required: true,
            },
            productName: String,
            quantity: Number,
            price: Number,
            images: [String],
          },
        ],
        subtotal: Number,
        shippingCost: Number,
        vendorEarnings: Number,
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ],
          default: "pending",
        },
        trackingNumber: String,
        shippedAt: Date,
        deliveredAt: Date,
      },
    ],
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      shippingAddress: {
        address: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },
    totalAmount: Number,
    platformFee: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "hold", "released", "refunded"],
      default: "pending",
    },
    paymentReference: String,
    orderStatus: {
      type: String,
      enum: ["pending", "paid", "processing", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
