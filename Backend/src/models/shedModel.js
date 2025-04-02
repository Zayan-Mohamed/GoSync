import mongoose from "mongoose";

const shedSchema = new mongoose.Schema({
  message: { type: String, required: true },
  shedDate: { type: String, required: true }, // YYYY-MM-DD
  shedTime: { type: String, required: true }, // HH:mm
  status: { type: String, enum: ["pending", "sent"], default: "pending" },
});

shedSchema.virtual("shedDateTime").get(function() {
  // Combine the shedDate and shedTime into a proper Date object
  const [year, month, day] = this.shedDate.split("-"); // Split shedDate (YYYY-MM-DD)
  const [hour, minute] = this.shedTime.split(":"); // Split shedTime (HH:mm)
  return new Date(year, month - 1, day, hour, minute); // Create Date object
});

const ShedMessage = mongoose.model("ShedMessage", shedSchema);
export default ShedMessage;
