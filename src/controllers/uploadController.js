// import cloudinary from "../../config/cloudinary.js";
import cloudinary from "../config/cloudinary.js";

// import User from "../models/User.js";
import User from "../models/users.js";

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
