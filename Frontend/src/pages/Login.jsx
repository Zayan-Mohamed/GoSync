/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import gosyncLogo from "/assets/GoSync.png";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [inputFocus, setInputFocus] = useState({
    email: false,
    password: false,
  });
  const [inputValue, setInputValue] = useState({
    email: false,
    password: false,
  });
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    setInputValue({
      email: email.length > 0,
      password: password.length > 0,
    });
  }, [email, password]);

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        when: "beforeChildren",
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02, boxShadow: "0 10px 15px rgba(255, 107, 0, 0.2)" },
    tap: { scale: 0.98 },
    loading: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
    success: {
      scale: [1, 1.15, 1],
      backgroundColor: "#4BB543",
      transition: { duration: 0.5 },
    },
  };

  const labelVariants = {
    hidden: { y: 0, opacity: 0 },
    visible: { y: -10, opacity: 1, transition: { duration: 0.3 } },
    exit: { y: 0, opacity: 0, transition: { duration: 0.3 } },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 500, damping: 15 },
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("Form submitted with:", { email, password });

    const response = await login(email, password);
    console.log("Login response:", response);

    if (!response.success) {
      setError(response.message);
      setIsLoading(false);
      console.log("Login failed:", response.message);
    } else {
      const { user } = useAuthStore.getState();
      console.log("User state:", user);

      // Show success animation
      setLoginSuccess(true);

      // Delay navigation to show success animation
      setTimeout(() => {
        const userRole = user?.role || "passenger"; // Fallback to "passenger" if role is missing
        console.log("Navigating to role:", userRole);

        // Explicitly check userRole value
        if (userRole === "admin") {
          console.log("Redirecting to /admin");
          navigate("/admin");
        } else if (userRole === "passenger") {
          console.log("Redirecting to /passenger");
          navigate("/passenger");
        } else {
          console.log("Redirecting to /unauthorized");
          navigate("/unauthorized");
        }
      }, 1000);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      {/* Updated Beautiful Background Design */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-deepOrange/10 via-white to-brightYellow/20"></div>

        {/* Animated floating elements */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-72 h-72 bg-deepOrange opacity-10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        ></motion.div>
        <motion.div
          className="absolute top-1/3 right-1/3 w-72 h-72 bg-softPeach opacity-40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        ></motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-brightYellow opacity-20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 15, 0],
            y: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            delay: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        ></motion.div>

        {/* Geometric pattern overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FF6B00' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            className="w-full"
            style={{ filter: "opacity(0.1)" }}
          >
            <path
              fill="#FF6B00"
              fillOpacity="1"
              d="M0,224L48,218.7C96,213,192,203,288,181.3C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,133.3C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </div>

      <motion.div
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur-sm bg-white/90 border border-gray-100 relative z-10"
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-brightYellow via-deepOrange to-sunsetOrange"></div>

        <motion.img
          variants={childVariants}
          src={gosyncLogo}
          alt="GoSync Logo"
          className="mx-auto w-32 mb-6 drop-shadow-md"
          whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
        />
        <motion.h2
          variants={childVariants}
          className="text-2xl font-bold text-darkCharcoal text-center mb-6"
        >
          Welcome Back to GoSync
        </motion.h2>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="relative mb-4"
            >
              <motion.p
                className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200 shadow-sm"
                animate={{
                  x: [0, -5, 5, -5, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <motion.span
                  className="absolute left-2 top-3 text-red-500"
                  initial="hidden"
                  animate="pulse"
                  variants={iconVariants}
                >
                  ⚠️
                </motion.span>
                <span className="pl-6">{error}</span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          variants={childVariants}
        >
          <motion.div className="relative" variants={childVariants}>
            <AnimatePresence>
              {inputFocus.email || inputValue.email ? (
                <motion.label
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute text-xs font-medium text-brightYellow z-10 left-2 bg-white px-1"
                >
                  Email
                </motion.label>
              ) : null}
            </AnimatePresence>

            <motion.input
              type="email"
              placeholder={inputFocus.email ? "" : "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setInputFocus({ ...inputFocus, email: true })}
              onBlur={() => setInputFocus({ ...inputFocus, email: false })}
              className={`w-full p-3 pl-5 border rounded-lg focus:outline-none transition-all duration-300 ${
                inputFocus.email
                  ? "border-brightYellow ring-2 ring-brightYellow/30 shadow-md"
                  : inputValue.email
                    ? "border-green-400"
                    : "border-gray-300"
              }`}
              required
              animate={inputFocus.email ? { scale: 1.01 } : { scale: 1 }}
            />

            <motion.div
              className={`absolute left-0 bottom-0 h-0.5 ${inputValue.email && !inputFocus.email ? "bg-green-400" : "bg-brightYellow"}`}
              initial={{ width: "0%" }}
              animate={{
                width: inputFocus.email || inputValue.email ? "100%" : "0%",
              }}
              transition={{ duration: 0.3 }}
            />

            <AnimatePresence>
              {inputValue.email && !inputFocus.email && (
                <motion.span
                  className="absolute right-3 top-3 text-green-500"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={iconVariants}
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div className="relative" variants={childVariants}>
            <AnimatePresence>
              {inputFocus.password || inputValue.password ? (
                <motion.label
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute text-xs font-medium text-brightYellow z-10 left-2 bg-white px-1"
                >
                  Password
                </motion.label>
              ) : null}
            </AnimatePresence>

            <motion.input
              type="password"
              placeholder={inputFocus.password ? "" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setInputFocus({ ...inputFocus, password: true })}
              onBlur={() => setInputFocus({ ...inputFocus, password: false })}
              className={`w-full p-3 pl-5 border rounded-lg focus:outline-none transition-all duration-300 ${
                inputFocus.password
                  ? "border-brightYellow ring-2 ring-brightYellow/30 shadow-md"
                  : inputValue.password
                    ? "border-green-400"
                    : "border-gray-300"
              }`}
              required
              animate={inputFocus.password ? { scale: 1.01 } : { scale: 1 }}
            />

            <motion.div
              className={`absolute left-0 bottom-0 h-0.5 ${inputValue.password && !inputFocus.password ? "bg-green-400" : "bg-brightYellow"}`}
              initial={{ width: "0%" }}
              animate={{
                width:
                  inputFocus.password || inputValue.password ? "100%" : "0%",
              }}
              transition={{ duration: 0.3 }}
            />

            <AnimatePresence>
              {inputValue.password && !inputFocus.password && (
                <motion.span
                  className="absolute right-3 top-3 text-green-500"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={iconVariants}
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            animate={loginSuccess ? "success" : isLoading ? "loading" : "idle"}
            type="submit"
            disabled={isLoading || loginSuccess}
            className="w-full p-3 bg-deepOrange text-white font-bold rounded-lg transition-all transform duration-300 shadow-md relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <>
                  <motion.svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </motion.svg>
                  Logging in...
                </>
              ) : loginSuccess ? (
                <>
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                    className="mr-2"
                  >
                    ✓
                  </motion.span>
                  Success!
                </>
              ) : (
                "Login"
              )}
            </span>
            <motion.div
              className="absolute inset-0 bg-sunsetOrange"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
          </motion.button>
        </motion.form>

        <motion.div
          className="mt-5 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="w-full h-0.5 bg-gray-100"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>

        <motion.p
          variants={childVariants}
          className="text-center text-sm mt-6 text-gray-600"
        >
          Don't have an account?{" "}
          <motion.span
            whileHover={{ color: "#FF6B00", scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              to="/register"
              className="text-brightYellow font-medium hover:text-deepOrange transition-colors"
            >
              Sign up
            </Link>
          </motion.span>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
