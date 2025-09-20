const express = require("express");
const { userAdmin, userAuth } = require("../middlewares/user");
const {
  validateProductData,
  validateProductEditData,
} = require("../utils/validation");
const Product = require("../models/product");
const Order = require("../models/order");

const adminRouter = express.Router();

// /***********MANAGE PRODUCTS*************/
adminRouter.post("/products", userAuth, userAdmin, async (req, res) => {
  try {
    const { productData } = req.body;
    const errors = validateProductData(productData);
    if (errors.length > 0) {
      throw { message: errors, statusCode: 406 };
    }
    const {
      name,
      category,
      description,
      price,
      discountedPrice,
      images,
      stock,
    } = productData;
    const product = new Product({
      name,
      category,
      description,
      price,
      discountedPrice,
      images,
      stock,
    });

    await product.save();

    res.status(201).json({ message: "Product added successfully!" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

adminRouter.patch("/products/:id", userAuth, userAdmin, async (req, res) => {
  try {
    const { productData } = req.body;
    const errors = validateProductEditData(productData);
    if (errors.length > 0) {
      throw { message: errors, statusCode: 406 };
    }

    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, productData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      throw { message: "Product not found", statusCode: 404 };
    }

    res.status(200).json({ message: "Prouct Updated!" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

adminRouter.delete("/products/:id", userAuth, userAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Product.findByIdAndDelete(id);
    if (!del) {
      throw { message: "Product not found!", statusCode: 404 };
    }
    res.status(200).json({ message: "Product Deleted Successfully!" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// /***********MANAGE ORDERS*************/
adminRouter.get("/allOrders", userAuth, userAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 5, category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    if (page > totalPages) {
      return res.status(404).send("No Orders found");
    }

    const orders = await Order.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      page: Number(page),
      totalPages,
      totalOrders,
      orders,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

adminRouter.patch("/order/:id", userAuth, userAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      throw { message: "Order not found!", statusCode: 404 };
    }
    const { orderStatus } = req.body;
    order.orderStatus = orderStatus;

    await order.save();

    res.status(200).json({ message: "Order Status upadted successfully!!" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = adminRouter;
