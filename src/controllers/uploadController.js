// import cloudinary from "../../config/cloudinary.js";
import cloudinary from "../config/cloudinary.js";

// import User from "../models/User.js";
import User from "../models/users.js";
import Product from "../models/Product.js";

export const uploadDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded",
      });
    }

    const uploadedDocuments = {};
    const uploadPromises = [];

    // Upload each document to Cloudinary
    for (const [docType, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray[0]) {
        const file = fileArray[0];

        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: `beauty-platform/verification/${userId}`,
              public_id: `${docType}_${Date.now()}`,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  type: docType,
                  url: result.secure_url,
                  publicId: result.public_id,
                });
              }
            }
          );

          stream.end(file.buffer);
        });

        uploadPromises.push(uploadPromise);
      }
    }

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);

    // Update user document with uploaded files
    const updateData = {
      verificationStatus: "pending",
    };

    results.forEach((result) => {
      updateData[`verificationDocuments.${result.type}`] = {
        url: result.url,
        publicId: result.publicId,
        uploadedAt: new Date(),
      };
    });

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Documents uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload documents",
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { documentType } = req.params;

    const user = await User.findById(userId);

    if (!user.verificationDocuments[documentType]) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    // Delete from Cloudinary
    const publicId = user.verificationDocuments[documentType].publicId;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Remove from user record
    user.verificationDocuments[documentType] = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Document deletion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete document",
    });
  }
};

// Add these functions to your existing uploadController.js

// Upload profile image for all users
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const userId = req.userId;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: `beauty-platform/profiles/${userId}`,
          public_id: `profile_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: "fill", quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Update user profile image
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
      { new: true }
    ).select("profileImage name email role");

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload profile image",
    });
  }
};

// Upload cover image for vendors and professionals
export const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const userId = req.userId;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: `beauty-platform/covers/${userId}`,
          public_id: `cover_${Date.now()}`,
          transformation: [
            { width: 1200, height: 400, crop: "fill", quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Update user based on role
    let updateData = {};
    const user = await User.findById(userId);

    if (user.role === "hair_vendor") {
      updateData.coverImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } else if (["hair_dresser", "nail_technician"].includes(user.role)) {
      updateData["professionalProfile.coverImage"] = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } else {
      return res.status(403).json({
        success: false,
        error: "Cover images are only for vendors and professionals",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("name email role coverImage professionalProfile");

    res.json({
      success: true,
      message: "Cover image uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload cover image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload cover image",
    });
  }
};

// Upload product images
export const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No image files provided",
      });
    }

    const { productId } = req.params;
    const userId = req.userId;

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      _id: productId,
      vendor: userId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found or access denied",
      });
    }

    // Upload each image to Cloudinary
    const uploadPromises = req.files.map(
      (file, index) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: `beauty-platform/products/${productId}`,
              public_id: `product_${Date.now()}_${index}`,
              transformation: [
                { width: 800, height: 800, crop: "limit", quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        })
    );

    const results = await Promise.all(uploadPromises);

    // Create image objects
    const newImages = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      caption: `Product image ${index + 1}`,
      isPrimary: product.images.length === 0 && index === 0, // First image if no images exist
    }));

    // Add new images to product
    product.images = [...product.images, ...newImages];
    await product.save();

    res.json({
      success: true,
      message: "Product images uploaded successfully",
      images: newImages,
      product: {
        _id: product._id,
        name: product.name,
        images: product.images,
      },
    });
  } catch (error) {
    console.error("Upload product images error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload product images",
    });
  }
};

// Set primary product image
export const setPrimaryProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const userId = req.userId;

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      _id: productId,
      vendor: userId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found or access denied",
      });
    }

    // Reset all images to not primary
    product.images.forEach((image) => {
      image.isPrimary = false;
    });

    // Set the specified image as primary
    const targetImage = product.images.id(imageId);
    if (!targetImage) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    targetImage.isPrimary = true;
    await product.save();

    res.json({
      success: true,
      message: "Primary image set successfully",
      product: {
        _id: product._id,
        name: product.name,
        images: product.images,
      },
    });
  } catch (error) {
    console.error("Set primary image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to set primary image",
    });
  }
};

// Delete product image
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const userId = req.userId;

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      _id: productId,
      vendor: userId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found or access denied",
      });
    }

    // Find the image
    const imageIndex = product.images.findIndex(
      (img) => img._id.toString() === imageId
    );
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    const deletedImage = product.images[imageIndex];

    // Delete from Cloudinary
    if (deletedImage.publicId) {
      await cloudinary.uploader.destroy(deletedImage.publicId);
    }

    // Remove from array
    product.images.splice(imageIndex, 1);

    // If we deleted the primary image and there are other images, set first as primary
    if (deletedImage.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      product: {
        _id: product._id,
        name: product.name,
        images: product.images,
      },
    });
  } catch (error) {
    console.error("Delete product image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
    });
  }
};

// Upload professional portfolio images
export const uploadPortfolioImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No image files provided",
      });
    }

    const userId = req.userId;

    // Get user and ensure they are a professional
    const user = await User.findOne({
      _id: userId,
      role: { $in: ["hair_dresser", "nail_technician"] },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Only professionals can upload portfolio images",
      });
    }

    // Upload each image to Cloudinary
    const uploadPromises = req.files.map(
      (file, index) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: `beauty-platform/portfolio/${userId}`,
              public_id: `portfolio_${Date.now()}_${index}`,
              transformation: [
                { width: 800, height: 800, crop: "limit", quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        })
    );

    const results = await Promise.all(uploadPromises);

    // Create portfolio items
    const newPortfolioItems = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      caption: req.body.captions
        ? req.body.captions[index]
        : `Portfolio image ${index + 1}`,
      category: req.body.category || "general",
    }));

    // Add to portfolio
    if (!user.professionalProfile.portfolio) {
      user.professionalProfile.portfolio = [];
    }
    user.professionalProfile.portfolio = [
      ...user.professionalProfile.portfolio,
      ...newPortfolioItems,
    ];
    await user.save();

    res.json({
      success: true,
      message: "Portfolio images uploaded successfully",
      portfolio: newPortfolioItems,
      user: {
        _id: user._id,
        businessName: user.professionalProfile.businessName,
        portfolio: user.professionalProfile.portfolio,
      },
    });
  } catch (error) {
    console.error("Upload portfolio images error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload portfolio images",
    });
  }
};

// Delete profile image
export const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user.profileImage) {
      return res.status(404).json({
        success: false,
        error: "No profile image found",
      });
    }

    // Delete from Cloudinary
    if (user.profileImage.publicId) {
      await cloudinary.uploader.destroy(user.profileImage.publicId);
    }

    // Remove from user record
    user.profileImage = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Profile image deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete profile image",
    });
  }
};

// Delete cover image
export const deleteCoverImage = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    let coverImageField;
    if (user.role === "hair_vendor") {
      coverImageField = user.coverImage;
    } else if (["hair_dresser", "nail_technician"].includes(user.role)) {
      coverImageField = user.professionalProfile?.coverImage;
    }

    if (!coverImageField) {
      return res.status(404).json({
        success: false,
        error: "No cover image found",
      });
    }

    // Delete from Cloudinary
    if (coverImageField.publicId) {
      await cloudinary.uploader.destroy(coverImageField.publicId);
    }

    // Remove from user record
    if (user.role === "hair_vendor") {
      user.coverImage = undefined;
    } else {
      user.professionalProfile.coverImage = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cover image deleted successfully",
    });
  } catch (error) {
    console.error("Delete cover image error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete cover image",
    });
  }
};
