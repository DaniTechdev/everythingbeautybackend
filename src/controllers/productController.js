import Product from "../models/Product.js";
import User from "../models/users.js";
import mongoose from "mongoose";

// import cloudinary from "../../config/cloudinary.js";
import cloudinary from "../config/cloudinary.js";
// Get vendor's products
export const getMyProducts = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;

    const query = { vendor: req.userId };

    if (status !== "all") {
      query.status = status;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Check if vendor owns the product or product is published
    if (product.vendor.toString() !== req.userId && !product.isPublished) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

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

// Create new product
export const createProduct = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    console.log("user:", user);

    if (user.role !== "hair_vendor") {
      return res.status(403).json({
        success: false,
        error: "Only vendors can create products",
      });
    }

    if (user.verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        error: "Vendor account must be verified to create products",
      });
    }

    const productData = {
      ...req.body,
      vendor: req.userId,
      businessName: user.businessName,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create product",
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("productId:", productId);
    console.log("req.userID:", req.userId);

    const product = await Product.findById(productId);

    console.log("product:", product);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.vendor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update product",
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("Deleting productId:", productId);

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.vendor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    await Product.findByIdAndDelete(productId);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete product",
    });
  }
};

// Update product status
export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, isPublished } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.vendor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !product.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Product status updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update product status",
    });
  }
};

// Upload product images
export const uploadProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.vendor.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: `beauty-platform/products/${productId}`,
            transformation: [
              { width: 800, height: 800, crop: "limit", quality: "auto" },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                isPrimary: product.images.length === 0, // First image is primary
              });
            }
          }
        );

        stream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Add new images to product
    product.images.push(...uploadedImages);
    await product.save();

    res.json({
      success: true,
      message: "Images uploaded successfully",
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Upload product images error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload images",
    });
  }
};

// Delete product image
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.vendor.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const imageIndex = product.images.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    const image = product.images[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    // Remove from product
    product.images.splice(imageIndex, 1);

    // If we deleted the primary image, set a new primary
    if (image.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { vendor: new mongoose.Types.ObjectId(req.userId) },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
        },
      },
    ]);

    const totalProducts = await Product.countDocuments({ vendor: req.userId });
    const activeProducts = await Product.countDocuments({
      vendor: req.userId,
      status: "active",
      isPublished: true,
    });
    const outOfStock = await Product.countDocuments({
      vendor: req.userId,
      stock: 0,
      trackQuantity: true,
    });

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        byStatus: stats,
      },
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product statistics",
    });
  }
};
