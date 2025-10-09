const express = require("express");
const Product = require("../models/product");
const { userAuth } = require("../middlewares/user");
const { calcAvgRatings } = require("../utils/validation");

const productRouter = express.Router();

productRouter.get("/products", async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

productRouter.get("/specialProducts", async (req, res) => {
  try {
    const products = await Product.find({ special: true });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

productRouter.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productData = await Product.findOne({ _id: id });
    if (!productData) {
      throw {
        message: "Invalid Product ID! No Product found",
        statusCode: 404,
      };
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

productRouter.get("/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      throw { message: "No product found!", statusCode: 404 };
    }

    res.status(200).json(product.reviews);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

productRouter.post("/products/:id/reviews", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { review } = req.body;
    if (
      typeof review.ratings !== "number" ||
      review.ratings < 1 ||
      review.ratings > 5
    ) {
      throw { message: "Ratings must be between 1 and 5", statusCode: 406 };
    }

    if (review.comment && review.comment.trim().length < 5) {
      throw {
        message: "Comment must be at least 5 characters",
        statusCode: 406,
      };
    }

    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      throw { message: "Product not found", statusCode: 404 };
    }
    const newReview = {
      userId: user._id,
      ratings: review.ratings,
      comment: review.comment,
    };

    product.reviews.push(newReview);
    product.avgRating = calcAvgRatings(product.reviews);

    await product.save();

    res.status(201).json({
      message: "Review posted!!",
      reviews: product.reviews,
      avgRating: product.avgRating,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = productRouter;
