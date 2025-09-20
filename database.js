const mongoose = require("mongoose");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};
const connectDB = async () => {
  await mongoose.connect(
    `mongodb+srv://${dbConfig.user}:${dbConfig.password}@glowishii.vmd3x8p.mongodb.net/${dbConfig.database}?retryWrites=true&w=majority`
  );
};

module.exports = connectDB;
