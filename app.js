require("dotenv").config();
const express = require("express");
const connectDB = require("./database");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "http://localhost:1234", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./src/routesContainer/auth");
const uploadRouter = require("./src/routesContainer/upload");
const profileRouter = require("./src/routesContainer/profile");
const adminRouter = require("./src/routesContainer/admin");
const productRouter = require("./src/routesContainer/products");
const orderRouter = require("./src/routesContainer/order");
const listRouter = require("./src/routesContainer/list");

app.use("/", authRouter);
app.use("/", uploadRouter);
app.use("/", profileRouter);
app.use("/", adminRouter);
app.use("/", productRouter);
app.use("/", orderRouter);
app.use("/", listRouter);

connectDB()
  .then(() => {
    console.log("DB connected :)");
    app.listen(parseInt(process.env.PORT), () => {
      console.log("server test connected");
    });
  })
  .catch((err) => {
    console.log(err.errmsg);
    console.log("DB not connected :(");
  });
