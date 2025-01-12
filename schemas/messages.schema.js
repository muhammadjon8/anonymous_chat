const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true },
  message: { type: String, required: true },
  senderInfo: {
    ip: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
});

const Messages = mongoose.model("Messages", messageSchema);

module.exports = Messages;
