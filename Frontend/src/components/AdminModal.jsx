import { useState, useEffect } from "react";
import { FiX, FiEye, FiEyeOff, FiCheck, FiAlertTriangle } from "react-icons/fi";
import API from "../services/authService";
import { motion, AnimatePresence } from "framer-motion";

const AdminModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    color: "bg-gray-300",
    label: "Weak",
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };

  const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, color: "bg-gray-300", label: "Weak" };

    let strength = { score: 0, color: "bg-gray-300", label: "Weak" };

    // Length check
    if (password.length >= 8) strength.score += 1;

    // Contains uppercase letters
    if (/[A-Z]/.test(password)) strength.score += 1;

    // Contains numbers
    if (/\d/.test(password)) strength.score += 1;

    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) strength.score += 1;

    // Set color and label based on score
    switch (strength.score) {
      case 1:
        strength.color = "bg-red-500";
        strength.label = "Weak";
        break;
      case 2:
        strength.color = "bg-yellow-500";
        strength.label = "Medium";
        break;
      case 3:
        strength.color = "bg-green-500";
        strength.label = "Strong";
        break;
      case 4:
        strength.color = "bg-blue-500";
        strength.label = "Very Strong";
        break;
      default:
        strength.color = "bg-gray-300";
        strength.label = "Weak";
    }

    return strength;
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";

    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(formData.email))
      errors.email = "Invalid email format";

    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!validatePhone(formData.phone))
      errors.phone = "Phone should be 10 digits";

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    else if (passwordStrength.score < 2)
      errors.password = "Password is too weak";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }

    // Check password strength
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await API.post("/api/auth/admin/register", formData, {
        withCredentials: true,
      });
      setSuccess("Admin registered successfully!");
      setFormData({ name: "", email: "", phone: "", password: "" });

      // Reset password strength
      setPasswordStrength({
        score: 0,
        color: "bg-gray-300",
        label: "Weak",
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to register admin");
    } finally {
      setLoading(false);
    }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", duration: 0.3 },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", email: "", phone: "", password: "" });
      setError("");
      setSuccess("");
      setFormErrors({});
      setPasswordStrength({
        score: 0,
        color: "bg-gray-300",
        label: "Weak",
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <AnimatePresence>
        <motion.div
          className="bg-white p-6 rounded-lg shadow-xl w-96 relative"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Add an Admin
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition"
            >
              <FiX size={20} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FiCheck className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-deepOrange focus:border-transparent`}
                />
              </div>
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    formErrors.email ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-deepOrange focus:border-transparent`}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number (10 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    formErrors.phone ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-deepOrange focus:border-transparent`}
                />
              </div>
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    formErrors.password ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-deepOrange focus:border-transparent pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.password}
                </p>
              )}

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color}`}
                      style={{ width: `${25 * passwordStrength.score}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p
                      className={`text-xs ${passwordStrength.color.replace("bg-", "text-")}`}
                    >
                      {passwordStrength.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {passwordStrength.score}/4
                    </p>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              className="w-full bg-deepOrange text-white py-2 rounded hover:bg-sunsetOrange transition relative overflow-hidden"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={loading ? "invisible" : ""}>Add Admin</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                </div>
              )}
            </motion.button>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminModal;
