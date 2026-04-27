const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
    default: "",
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["client", "admin"],
    default: "client",
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: Date,
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
