import Notification from "../models/notificationModel.js";


export const create = async (req, res) => {
  try {
      const newNotification = new Notification(req.body);
      const savedNotification = await newNotification.save();
      res.status(201).json({ success: true, data: savedNotification });
  } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = req.params.id; // Get user ID from the URL parameter

    // Check if user exists by ID
    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(404).json({ message: "User not found" }); // If user not found, return 404
    }

    res.status(200).json(userExist); // If user found, return the user data
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' }); // Respond with error
  }
};