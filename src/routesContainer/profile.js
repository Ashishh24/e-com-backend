const express = require("express");
const { userAuth } = require("../middlewares/user");
const {
  validateEditData,
  validatePassword,
  validateAddress,
} = require("../utils/validation");
const User = require("../models/user");
const Pincode = require("../models/pincode");

const profileRouter = express.Router();

profileRouter.patch("/updateProfile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const updateData = req.body;
    const v = validateEditData(updateData);

    const r = await User.findByIdAndUpdate(user._id, updateData, {
      new: true, // return updated doc
      runValidators: true, // enforce schema validators
    });

    res.json({ updatedUserData: r, message: "Data updated successfully!!" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.patch("/updatePassword", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw { message: "All fields are required", statusCode: 404 };
    }
    const oldP = await user.matchPassword(oldPassword);
    if (!oldP) {
      throw { message: "Old Password is incorrect", statusCode: 401 };
    }
    if (oldPassword === newPassword) {
      throw {
        message: "New password must be different from old password",
        statusCode: 400,
      };
    }
    validatePassword(newPassword);

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      parseInt(process.env.PASS_HASH_SALT)
    );

    await loggedInUser.updateOne({ password: newPasswordHash });

    res.send("Password Updated Successfully!!");
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.get("/me", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw { message: "User not found", statusCode: 404 };
    }
    res.json(user);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.post("/address", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const newAddress = req.body;

    const { valid, message } = validateAddress(newAddress);
    if (!valid) {
      throw { message: message, statusCode: 400 };
    }

    const updatedUser = await User.findOneAndUpdate(
      userId,
      { $push: { address: newAddress } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw { message: "User not found", statusCode: 404 };
    }

    res.json({
      message: "Address added successfully",
      addresses: updatedUser.address,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.patch("/address/:id", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updates = req.body;

    const { valid, message } = validateAddress(updates);
    if (!valid) {
      throw { message: message, statusCode: 400 };
    }

    const address = user.address.id(id);
    if (!address) {
      throw { message: "Address not found", statusCode: 404 };
    }

    Object.keys(updates).forEach((key) => {
      address[key] = updates[key];
    });

    await user.save();

    res.json({ message: "Address updated successfully", address });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.delete("/address/:id", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const address = user.address.id(id);
    if (!address) {
      throw { message: "Address not found", statusCode: 404 };
    }

    // Remove address at index
    address.deleteOne();
    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.address,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

profileRouter.get("/pincode/:code", userAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const pincodeData = await Pincode.find({ pincode: String(code).trim() });

    if (!pincodeData) {
      throw { message: "No such pincode found", statusCode: 404 };
    }
    res.json(pincodeData);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = profileRouter;
