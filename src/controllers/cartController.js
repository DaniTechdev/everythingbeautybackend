// controllers/cartController.js
// import Cart from "../models/Cart.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId }).populate(
      "items.productId"
    );

    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [] });
    }

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, error: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        vendorId: product.vendorId,
      });
    }

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

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Item not found in cart" });
    }

    // Validate stock
    const product = await Product.findById(item.productId);
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, error: "Insufficient stock" });
    }

    item.quantity = quantity;

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
