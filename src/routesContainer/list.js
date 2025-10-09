const express = require("express");
const User = require("../models/user");
const Product = require("../models/product");
const { userAuth } = require("../middlewares/user");

const listRouter = express.Router();

/**
 * post - wishlist/item
 * get- wishlist
 * post - cart/item
 * get - cart
 * patch - cart/item
 * delete - cart/item
 */

// /**********WISHLIST************/
listRouter.post("/wishlist/:itemId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;

    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    const index = user.wishlist.indexOf(itemId);

    if (index === -1) {
      user.wishlist.push(itemId);
      await user.save();
      return res.status(201).json({ message: "Item added to Wishlist!" });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      return res.status(200).json({ message: "Item removed from Wishlist!" });
    }
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

listRouter.get("/wishlist", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user || user.wishlist.length === 0) {
      return res
        .status(200)
        .json({ message: "No products added to wishlist! Start Shopping!!" });
    }
    res.status(200).json(user.wishlist);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// /**********ORDER************/
listRouter.post("/cart/:itemId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;

    const product = await Product.findById(itemId);
    if (!product) {
      throw { message: "Product not found", statusCode: 404 };
    }
    const index = user.cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === itemId
    );

    if (index === -1) {
      user.cart.items.push({
        product: itemId,
        quantity: 1,
        itemsTotal: Number(product.discountedPrice),
      });
    } else {
      const index = user.cart.items.findIndex(
        (cartItem) => cartItem.product?.toString() === itemId
      );
      user.cart.items[index].quantity += 1;
      user.cart.items[index].itemsTotal =
        product.discountedPrice * user.cart.items[index].quantity;
    }

    user.cart.cartTotal = user.cart.items.reduce(
      (sum, item) => sum + item.itemsTotal,
      0
    );
    await user.save();
    await user.populate("cart.items.product");

    res
      .status(201)
      .json({ message: "Cart updated successfully", cart: user.cart });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

listRouter.patch("/cart/:itemId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;

    const product = await Product.findById(itemId);
    if (!product) {
      throw { message: "Product not found", statusCode: 404 };
    }
    const index = user.cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === itemId
    );
    if (index === -1) {
      throw { message: "Item not found in cart", statusCode: 404 };
    }

    let message;
    if (user.cart.items[index].quantity > 1) {
      user.cart.items[index].quantity -= 1;
      user.cart.items[index].itemsTotal =
        product.price * user.cart.items[index].quantity;
      message = "Product quantity decreased by 1";
    } else {
      user.cart.items.splice(index, 1);
      message = "Product removed from cart";
    }

    user.cart.cartTotal = user.cart.items.reduce(
      (sum, item) => sum + item.itemsTotal,
      0
    );

    await user.save();
    await user.populate("cart.items.product");

    res.status(200).json({ message, cart: user.cart });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

listRouter.delete("/cart/:itemId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;

    const product = await Product.findById(itemId);
    if (!product) {
      throw { message: "Product not found", statusCode: 404 };
    }
    const index = user.cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === itemId
    );
    if (index === -1) {
      throw { message: "Item not found in cart", statusCode: 404 };
    }

    user.cart.items.splice(index, 1);
    message = "Product removed from cart";

    user.cart.cartTotal = user.cart.items.reduce(
      (sum, item) => sum + item.itemsTotal,
      0
    );

    await user.save();
    await user.populate("cart.items.product");

    res.status(200).json({ message, cart: user.cart });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

listRouter.get("/cart", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "cart.items.product"
    );

    if (!user || !user.cart?.items || user.cart.items.length === 0) {
      return res
        .status(200)
        .json({ message: "No products added to Cart! Start Shopping!!" });
    }

    user.cart.items.forEach(
      (item) => (item.itemsTotal = item.product.discountedPrice * item.quantity)
    );
    user.cart.cartTotal = user.cart.items.reduce(
      (sum, item) => sum + item.itemsTotal,
      0
    );

    await user.save();

    res.status(200).json(user.cart);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = listRouter;
