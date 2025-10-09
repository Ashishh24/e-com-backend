const express = require("express");
const { validateOrderData } = require("../utils/validation");
const Order = require("../models/order");
const { userAuth } = require("../middlewares/user");

const orderRouter = express.Router();

orderRouter.post("/order", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { orderData } = req.body;
    const errors = validateOrderData(orderData);
    if (errors.length > 0) {
      throw { message: errors, statusCode: 406 };
    }

    const { items, shippingAddress, payment, totalAmount } = orderData;

    const order = new Order({
      userId: user._id,
      items,
      shippingAddress,
      payment,
      totalAmount,
    });

    await order.save();

    res.status(201).json({ message: "Order created successfully!", order });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

orderRouter.get("/orders", userAuth, async (req, res) => {
  try {
    const id = req.user._id;
    const { page = 1, limit = 5, category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }

    const totalOrders = await Order.countDocuments({ userId: id, ...filter });
    const totalPages = Math.ceil(totalOrders / limit);

    if (page > totalPages) {
      return res.status(404).send("No Orders found");
    }

    const orders = await Order.find({ userId: id, ...filter })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

orderRouter.get("/orders/:id", userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = await Order.findOne({ _id: id });
    if (!orderData) {
      throw { message: "Invalid order ID! No Order found", statusCode: 404 };
    }
    res.status(200).json(orderData);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = orderRouter;
