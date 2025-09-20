const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      phone: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ["COD", "Credit Card", "UPI", "Net Banking"],
        required: true,
      },
      status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
      },
      transactionId: { type: String }, // if payment gateway used
    },
    orderStatus: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    itemsTotal: {
      type: Number,
      min: 0,
    },
    deliveryCharges: {
      type: Number,
      min: 0,
    },
    // GST: {
    //   type: Number,
    //   min: 0
    // },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  const order = this;

  // Sum of all item amounts
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const DELIVERY_CHARGES = 100; // fixed delivery
  // const GST_PERCENT = 0.18; // 18% GST

  order.itemsTotal = itemsTotal;
  order.deliveryCharges = DELIVERY_CHARGES;
  // order.GST = +(itemsTotal * GST_PERCENT).toFixed(2); // round to 2 decimals
  order.totalAmount = itemsTotal + DELIVERY_CHARGES; //+ order.GST;

  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
