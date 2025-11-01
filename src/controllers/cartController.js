// controllers/cartController.js
// import Cart from "../models/Cart.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";

// export const getCart = async (req, res) => {
//   console.log("Getting cart for user:", req.userId);

//   try {
//     let cart = await Cart.findOne({ userId: req.userId }).populate(
//       "items.productId"
//     );

//     if (!cart) {
//       cart = await Cart.create({ userId: req.userId, items: [] });
//     }

//     console.log("Cart retrieved:", cart);

//     res.json({ success: true, cart });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// controllers/cartController.js - ENHANCED getCart

// export const getCart = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     console.log("🔄 getCart called for user:", userId);

//     let cart = await Cart.findOne({ userId })
//       .populate("items.productId", "name price images brand stock")
//       .populate("items.vendorId", "businessName email isVerified");

//     console.log("📦 Cart found in DB:", {
//       exists: !!cart,
//       itemsCount: cart?.items?.length || 0,
//       items: cart?.items?.map((item) => ({
//         productId: item.productId?._id,
//         productName: item.productId?.name,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//     });

//     // If no cart exists, return empty cart structure
//     if (!cart) {
//       console.log("📭 No cart found for user, creating empty response");
//       return res.json({
//         success: true,
//         cart: {
//           items: [],
//           itemCount: 0,
//           total: 0,
//           vendors: [],
//         },
//         items: [], // Ensure this array exists
//         itemCount: 0,
//         total: 0,
//         vendors: [],
//       });
//     }

//     // Calculate totals
//     const itemCount = cart.items.reduce(
//       (total, item) => total + item.quantity,
//       0
//     );
//     const total = cart.items.reduce((total, item) => {
//       const price = item.price || item.productId?.price || 0;
//       return total + price * item.quantity;
//     }, 0);

//     const responseData = {
//       success: true,
//       cart: {
//         items: cart.items,
//         itemCount,
//         total,
//         vendors: [...new Set(cart.items.map((item) => item.vendorId))],
//       },
//       items: cart.items, // Make sure this is included
//       itemCount,
//       total,
//       vendors: [...new Set(cart.items.map((item) => item.vendorId))],
//     };

//     console.log("✅ getCart response:", {
//       items: responseData.items.length,
//       itemCount: responseData.itemCount,
//       total: responseData.total,
//     });

//     res.json(responseData);
//   } catch (error) {
//     console.error("❌ getCart error:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("🔄 getCart called for user:", userId);

    let cart = await Cart.findOne({ userId })
      .populate("items.productId", "name price images brand stock")
      .populate("items.vendorId", "businessName email isVerified");

    console.log("📦 Cart found in DB:", {
      exists: !!cart,
      itemsCount: cart?.items?.length || 0,
    });

    // If no cart exists, return empty cart structure
    if (!cart) {
      console.log("📭 No cart found for user, creating empty response");
      return res.json({
        success: true,
        cart: {
          items: [],
          itemCount: 0,
          total: 0,
          vendors: [],
        },
        items: [],
        itemCount: 0,
        total: 0,
        vendors: [],
      });
    }

    // Calculate totals
    const itemCount = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const total = cart.items.reduce((total, item) => {
      const price = item.price || item.productId?.price || 0;
      return total + price * item.quantity;
    }, 0);

    const vendors = [
      ...new Set(
        cart.items.map((item) => item.vendorId?.toString()).filter(Boolean)
      ),
    ];

    const responseData = {
      success: true,
      cart: {
        items: cart.items,
        itemCount,
        total,
        vendors,
      },
      items: cart.items,
      itemCount,
      total,
      vendors,
    };

    console.log("✅ getCart response:", {
      items: responseData.items.length,
      itemCount: responseData.itemCount,
      total: responseData.total,
    });

    res.json(responseData);
  } catch (error) {
    console.error("❌ getCart error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// // export const addToCart = async (req, res) => {
// //   console.log("Adding to cart for user:", req.userId, "with body:", req.body);

// //   try {
// //     const { productId, quantity = 1, vendorId } = req.body;

// //     // Validate product exists and has stock
// //     const product = await Product.findById(productId);
// //     if (!product) {
// //       return res
// //         .status(404)
// //         .json({ success: false, error: "Product not found" });
// //     }

// //     if (product.stock < quantity) {
// //       return res
// //         .status(400)
// //         .json({ success: false, error: "Insufficient stock" });
// //     }

// //     let cart = await Cart.findOne({ userId: req.userId });

// //     if (!cart) {
// //       cart = new Cart({ userId: req.userId, items: [] });
// //     }

// //     // Check if product already in cart
// //     const existingItemIndex = cart.items.findIndex(
// //       (item) => item.productId.toString() === productId
// //     );

// //     if (existingItemIndex > -1) {
// //       // Update quantity
// //       cart.items[existingItemIndex].quantity += quantity;
// //     } else {
// //       // Add new item
// //       cart.items.push({
// //         productId,
// //         quantity,
// //         price: product.price,
// //         vendorId: vendorId,
// //       });
// //     }

// //     // Recalculate totals
// //     cart.itemCount = cart.items.reduce(
// //       (total, item) => total + item.quantity,
// //       0
// //     );
// //     cart.total = cart.items.reduce(
// //       (total, item) => total + item.price * item.quantity,
// //       0
// //     );

// //     await cart.save();
// //     await cart.populate("items.productId");

// //     res.json({ success: true, cart });
// //   } catch (error) {
// //     res.status(500).json({ success: false, error: error.message });
// //   }
// // };

// // cartController.js - ENHANCE addToCart WITH BETTER DEBUGGING
// // export const addToCart = async (req, res) => {
// //   try {
// //     const { productId, quantity = 1, vendorId } = req.body;
// //     const userId = req.userId;

// //     console.log("🛒 addToCart - Request:", {
// //       userId,
// //       productId,
// //       quantity,
// //       vendorId,
// //     });

// //     // Validate product exists
// //     const product = await Product.findById(productId);
// //     if (!product) {
// //       return res
// //         .status(404)
// //         .json({ success: false, error: "Product not found" });
// //     }

// //     let cart = await Cart.findOne({ userId });

// //     if (!cart) {
// //       console.log("🛒 Creating new cart for user");
// //       cart = new Cart({ userId, items: [] });
// //     }

// //     // CRITICAL: Check if product already in cart
// //     const existingItemIndex = cart.items.findIndex(
// //       (item) => item.productId.toString() === productId
// //     );

// //     console.log("🛒 Existing item check:", {
// //       existingItemIndex,
// //       currentCartItems: cart.items.length,
// //       currentItems: cart.items.map((item) => ({
// //         productId: item.productId.toString(),
// //         quantity: item.quantity,
// //       })),
// //     });

// //     if (existingItemIndex > -1) {
// //       // Update quantity if item exists
// //       const newQuantity = cart.items[existingItemIndex].quantity + quantity;
// //       console.log("✅ Updating existing item:", {
// //         from: cart.items[existingItemIndex].quantity,
// //         to: newQuantity,
// //       });

// //       cart.items[existingItemIndex].quantity = newQuantity;
// //     } else {
// //       // Add new item only if it doesn't exist
// //       console.log("🆕 Adding new item to cart");
// //       cart.items.push({
// //         productId,
// //         quantity,
// //         price: product.price,
// //         vendorId: vendorId,
// //       });
// //     }

// //     // Recalculate totals
// //     cart.itemCount = cart.items.reduce(
// //       (total, item) => total + item.quantity,
// //       0
// //     );
// //     cart.total = cart.items.reduce(
// //       (total, item) => total + item.price * item.quantity,
// //       0
// //     );

// //     console.log("🛒 Cart before save:", {
// //       itemsCount: cart.items.length,
// //       itemCount: cart.itemCount,
// //       total: cart.total,
// //     });

// //     await cart.save();
// //     await cart.populate("items.productId");

// //     console.log("✅ addToCart completed:", {
// //       itemsCount: cart.items.length,
// //       itemCount: cart.itemCount,
// //       total: cart.total,
// //     });

// //     res.json({ success: true, cart });
// //   } catch (error) {
// //     console.error("❌ addToCart error:", error);
// //     res.status(500).json({ success: false, error: error.message });
// //   }
// // };

// // cartController.js - RETURN BOTH STRUCTURES
// export const addToCart = async (req, res) => {
//   try {
//     const { productId, quantity = 1, vendorId } = req.body;
//     const userId = req.userId;

//     console.log("🛒 addToCart - Request:", {
//       userId,
//       productId,
//       quantity,
//       vendorId,
//     });

//     // Validate product exists
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Product not found" });
//     }

//     let cart = await Cart.findOne({ userId });

//     if (!cart) {
//       console.log("🛒 Creating new cart for user");
//       cart = new Cart({ userId, items: [] });
//     }

//     // Check if product already in cart
//     const existingItemIndex = cart.items.findIndex(
//       (item) => item.productId.toString() === productId
//     );

//     console.log("🛒 Existing item check:", {
//       existingItemIndex,
//       currentCartItems: cart.items.length,
//     });

//     if (existingItemIndex > -1) {
//       // Update quantity if item exists
//       const newQuantity = cart.items[existingItemIndex].quantity + quantity;
//       console.log("✅ Updating existing item:", {
//         from: cart.items[existingItemIndex].quantity,
//         to: newQuantity,
//       });
//       cart.items[existingItemIndex].quantity = newQuantity;
//     } else {
//       // Add new item only if it doesn't exist
//       console.log("🆕 Adding new item to cart");
//       cart.items.push({
//         productId,
//         quantity,
//         price: product.price,
//         vendorId: vendorId,
//       });
//     }

//     // Recalculate totals
//     cart.itemCount = cart.items.reduce(
//       (total, item) => total + item.quantity,
//       0
//     );
//     cart.total = cart.items.reduce(
//       (total, item) => total + item.price * item.quantity,
//       0
//     );

//     console.log("🛒 Cart before save:", {
//       itemsCount: cart.items.length,
//       itemCount: cart.itemCount,
//       total: cart.total,
//     });

//     await cart.save();
//     await cart.populate("items.productId");

//     console.log("✅ addToCart completed:", {
//       itemsCount: cart.items.length,
//       itemCount: cart.itemCount,
//       total: cart.total,
//     });

//     // RETURN BOTH STRUCTURES for frontend compatibility
//     res.json({
//       success: true,
//       cart, // Original structure
//       items: cart.items, // Direct items array
//       itemCount: cart.itemCount,
//       total: cart.total,
//       vendors: [...new Set(cart.items.map((item) => item.vendorId.toString()))],
//     });
//   } catch (error) {
//     console.error("❌ addToCart error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// export const updateCartItem = async (req, res) => {
//   try {
//     const { itemId } = req.params;
//     const { quantity } = req.body;

//     const cart = await Cart.findOne({ userId: req.userId });
//     if (!cart) {
//       return res.status(404).json({ success: false, error: "Cart not found" });
//     }

//     const item = cart.items.id(itemId);
//     if (!item) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Item not found in cart" });
//     }

//     // Validate stock
//     const product = await Product.findById(item.productId);
//     if (product.stock < quantity) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Insufficient stock" });
//     }

//     item.quantity = quantity;

//     // Recalculate totals
//     cart.itemCount = cart.items.reduce(
//       (total, item) => total + item.quantity,
//       0
//     );
//     cart.total = cart.items.reduce(
//       (total, item) => total + item.price * item.quantity,
//       0
//     );

//     await cart.save();
//     await cart.populate("items.productId");

//     res.json({ success: true, cart });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// cartController.js - UPDATE updateCartItem TOO

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, vendorId } = req.body;
    const userId = req.userId;

    console.log("🛒 addToCart - Request:", {
      userId,
      productId,
      quantity,
      vendorId,
    });

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Use findOneAndUpdate with atomic operations to prevent race conditions
    let cart = await Cart.findOneAndUpdate(
      { userId },
      {},
      { new: true, upsert: true }
    ).populate("items.productId");

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    console.log("🛒 Existing item check:", {
      existingItemIndex,
      currentCartItems: cart.items.length,
    });

    let updatedCart;

    if (existingItemIndex > -1) {
      // Update quantity atomically
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      console.log("✅ Updating existing item:", {
        from: cart.items[existingItemIndex].quantity,
        to: newQuantity,
      });

      // Use atomic array update
      updatedCart = await Cart.findOneAndUpdate(
        { userId, "items.productId": productId },
        {
          $set: {
            "items.$.quantity": newQuantity,
            "items.$.price": product.price, // Ensure price is current
          },
        },
        { new: true }
      ).populate("items.productId");
    } else {
      // Add new item atomically
      console.log("🆕 Adding new item to cart");
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              productId,
              quantity,
              price: product.price,
              vendorId: vendorId,
            },
          },
        },
        { new: true }
      ).populate("items.productId");
    }

    // ALWAYS recalculate totals from the fresh database state
    const freshCart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    const itemCount = freshCart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const total = freshCart.items.reduce((total, item) => {
      const price = item.price || item.productId?.price || 0;
      return total + price * item.quantity;
    }, 0);

    // Update the cart with correct totals
    freshCart.itemCount = itemCount;
    freshCart.total = total;
    await freshCart.save();

    console.log("✅ addToCart completed - VERIFIED:", {
      itemsCount: freshCart.items.length,
      itemCount: freshCart.itemCount,
      total: freshCart.total,
      calculatedItemCount: itemCount,
      calculatedTotal: total,
    });

    // RETURN BOTH STRUCTURES for frontend compatibility
    res.json({
      success: true,
      cart: freshCart,
      items: freshCart.items,
      itemCount: freshCart.itemCount,
      total: freshCart.total,
      vendors: [
        ...new Set(freshCart.items.map((item) => item.vendorId?.toString())),
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("❌ addToCart error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// export const updateCartItem = async (req, res) => {
//   try {
//     const { itemId } = req.params;
//     const { quantity } = req.body;

//     const cart = await Cart.findOne({ userId: req.userId });
//     if (!cart) {
//       return res.status(404).json({ success: false, error: "Cart not found" });
//     }

//     const item = cart.items.id(itemId);
//     if (!item) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Item not found in cart" });
//     }

//     // Validate stock
//     const product = await Product.findById(item.productId);
//     if (product.stock < quantity) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Insufficient stock" });
//     }

//     item.quantity = quantity;

//     // Recalculate totals
//     cart.itemCount = cart.items.reduce(
//       (total, item) => total + item.quantity,
//       0
//     );
//     cart.total = cart.items.reduce(
//       (total, item) => total + item.price * item.quantity,
//       0
//     );

//     await cart.save();
//     await cart.populate("items.productId");

//     // RETURN BOTH STRUCTURES
//     res.json({
//       success: true,
//       cart,
//       items: cart.items,
//       itemCount: cart.itemCount,
//       total: cart.total,
//       vendors: [...new Set(cart.items.map((item) => item.vendorId.toString()))],
//     });
//   } catch (error) {
//     console.error("❌ updateCartItem error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;

    // Validate stock first
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Item not found in cart" });
    }

    const product = await Product.findById(item.productId);
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, error: "Insufficient stock" });
    }

    // Update quantity atomically
    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items._id": itemId },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    ).populate("items.productId");

    // ALWAYS recalculate totals from fresh state
    const freshCart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    const itemCount = freshCart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const total = freshCart.items.reduce((total, item) => {
      const price = item.price || item.productId?.price || 0;
      return total + price * item.quantity;
    }, 0);

    freshCart.itemCount = itemCount;
    freshCart.total = total;
    await freshCart.save();

    console.log("✅ updateCartItem completed - VERIFIED:", {
      itemsCount: freshCart.items.length,
      itemCount: freshCart.itemCount,
      total: freshCart.total,
    });

    res.json({
      success: true,
      cart: freshCart,
      items: freshCart.items,
      itemCount: freshCart.itemCount,
      total: freshCart.total,
      vendors: [
        ...new Set(freshCart.items.map((item) => item.vendorId?.toString())),
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("❌ updateCartItem error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    cart.items.pull(itemId);

    // Recalculate totals
    cart.itemCount = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cart.total = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.productId");

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    cart.items = [];
    cart.itemCount = 0;
    cart.total = 0;

    await cart.save();

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
