const { default: mongoose } = require("mongoose");
const validator = require("validator");

const validateSignupData = (req) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (name.length < 2 || name.length > 50) {
    errors.push({
      field: "name",
      message: "Name must be 2-50 characters long",
    });
  }

  if (!email) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: "email", message: "Email is not appropriate!" });
  }

  if (!password) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    errors.push({
      field: "password",
      message:
        "Password must be 8+ chars with uppercase, lowercase, number & special char",
    });
  }

  return errors;
};

const validateEditData = (data) => {
  fieldAllowed = ["name", "gender", "phone", "address"];
  isEditAllowed = Object.keys(data).every((k) => fieldAllowed.includes(k));
  if (!isEditAllowed) {
    throw {
      message: "Some fields are not allowed to be updated",
      statusCode: 406,
    };
  }

  if (
    data.phone &&
    data.phone.trim() !== "" &&
    !/^(\+91)?[6-9]\d{9}$/.test(data.phone)
  ) {
    throw { message: "Invalid phone number", statusCode: 406 };
  }
  return isEditAllowed;
};

const validatePassword = (newPassword) => {
  if (
    !newPassword ||
    newPassword.length < 8 ||
    !validator.isStrongPassword(newPassword)
  ) {
    throw {
      message:
        "Password must be 8+ chars with uppercase, lowercase, number & special char.",
      statusCode: 406,
    };
  }
  return true;
};

const validateAddress = (address) => {
  const requiredFields = ["street", "city", "state", "pincode", "phone"];

  for (const field of requiredFields) {
    if (!address[field]) {
      return { valid: false, message: `${field} is required` };
    }
  }

  if (!/^\d{6}$/.test(address.pincode)) {
    return {
      valid: false,
      message: "Invalid Indian pincode (must be 6 digits)",
    };
  }

  if (!/^(\+91)?[6-9]\d{9}$/.test(address.phone)) {
    return { valid: false, message: "Invalid phone number" };
  }

  return { valid: true };
};

const validateProductData = (productData) => {
  const errors = [];
  const { name, category, price, discountedPrice, images } = productData;

  if (!name || name.trim().length < 2) {
    errors.push("Product name must be at least 2 characters");
  }

  if (!category) {
    errors.push("Invalid category");
  }

  if (!price || price <= 0) {
    errors.push("Price must be greater than 0");
  }

  if (discountedPrice && discountedPrice > price) {
    errors.push("Discounted price cannot exceed original price");
  }

  if (!images || images.length === 0) {
    errors.push("At least one product photo is required");
  }

  return errors;
};

const validateProductEditData = (productData) => {
  const errors = [];

  const { name, category, price, discountedPrice, images } = productData;

  if (name !== undefined && name.trim().length < 2) {
    errors.push("Product name must be at least 2 characters");
  }

  // const allowedCategories = ["jar", "pillar", "bouquet", "decor", "other"];
  // if (
  //   category !== undefined &&
  //   !allowedCategories.includes(category.toLowerCase())
  // ) 
  if(!category){
    errors.push("Invalid category");
  }

  if (price !== undefined && price <= 0) {
    errors.push("Price must be greater than 0");
  }

  if (discountedPrice !== undefined) {
    if (price !== undefined && discountedPrice > price) {
      errors.push("Discounted price cannot exceed original price");
    }
    if (discountedPrice < 0) {
      errors.push("Discounted price cannot be negative");
    }
  }

  if (images !== undefined && (!Array.isArray(images) || images.length === 0)) {
    errors.push("At least one product photo is required");
  }

  return errors;
};

const validateOrderData = (orderData) => {
  const errors = [];
  const { items, shippingAddress, payment } = orderData;

  let total = 0;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push("Order must have at least one item.");
  } else {
    items.forEach((item, index) => {
      total += item.quantity * item.price;
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        errors.push(`Item at index ${index} has invalid or missing productId.`);
      }
      if (!item.name || !item.name.trim()) {
        errors.push(`Item at index ${index} must have a name.`);
      }
      if (!item.image || !item.image.trim()) {
        errors.push(`Item at index ${index} must have an image URL.`);
      }
    });
  }

  if (!shippingAddress) {
    errors.push("Shipping address is required.");
  } else {
    const { street, city, state, pincode, phone } = shippingAddress;
    if (!street || !street.trim())
      errors.push("Street is required in shipping address.");
    if (!city || !city.trim())
      errors.push("City is required in shipping address.");
    if (!state || !state.trim())
      errors.push("State is required in shipping address.");
    if (!pincode || !/^\d{6}$/.test(pincode))
      errors.push("Postal code must be a 6-digit number.");
    if (!phone || !/^(\+91)?[6-9]\d{9}$/.test(phone))
      errors.push("Invalid Indian phone number in shipping address.");
  }

  if (!payment || !payment.method) {
    errors.push("Payment method is required.");
  } else {
    const allowedMethods = ["COD", "Credit Card", "UPI", "Net Banking"];
    if (!allowedMethods.includes(payment.method)) {
      errors.push(
        `Payment method must be one of: ${allowedMethods.join(", ")}`
      );
    }
  }

  return errors;
};

const calcAvgRatings = (reviews) => {
  const len = reviews.length;
  let totalRating = 0;
  reviews.forEach((r) => {
    totalRating = totalRating + r.ratings;
  });
  const avgRating = totalRating / len;
  return avgRating.toFixed(1);
};

module.exports = {
  validateSignupData,
  validateEditData,
  validatePassword,
  validateAddress,
  validateProductData,
  validateProductEditData,
  validateOrderData,
  calcAvgRatings,
};
