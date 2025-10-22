const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const cookie = req.cookies;
    const { token } = cookie;

    if (!token) {
      throw { message: "Invalid Token!", statusCode: 401 };
    }
    const decodedId = jwt.verify(token, process.env.JWT_KEY);
    const { _id } = decodedId;

    const user = await User.findById(_id);
    req.user = user;
    next();
  } catch (err) {
    res.status(err.statusCode || 401).json({ message: err.message });
  }
};

const userAdmin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    throw { message: "Access denied. Admins only.", statusCode: 403 };
  }
  next();
};

module.exports = { userAuth, userAdmin };
