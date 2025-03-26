import mongoose from "mongoose";

const shedSchema = new mongoose.Schema({
  message: { type: String, required: true },
  shedDate: { type: String, required: true }, // YYYY-MM-DD
  shedTime: { type: String, required: true }, // HH:mm
  status: { type: String, enum: ["pending", "sent"], default: "pending" },
});

const ShedMessage = mongoose.model("ShedMessage", shedSchema);
export default ShedMessage;
