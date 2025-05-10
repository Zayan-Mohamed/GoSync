/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/authService";
import { Link } from "react-router-dom";
import gosyncLogo from "/assets/GoSync-Logo.png";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { TextField, InputAdornment } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled component for Material UI phone input
const StyledPhoneInput = styled(PhoneInput)(({ theme }) => ({
  "& .form-control": {
    width: "82%",
    marginLeft: "70px",
    height: "40px",
    fontSize: "16px",
    borderRadius: "8px",
    padding: "8px 0px 0px 80px", // Increased left padding to ensure space for flag and code
    transition: "all 0.3s ease",
  },
  "& .flag-dropdown": {
    borderTopLeftRadius: "8px",
    borderBottomLeftRadius: "8px",
    borderRight: "1px solid #e2e8f0",
    background: "transparent",
    width: "auto",
    overflow: "visible",
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
  },
  "& .selected-flag": {
    padding: "0 12px",
    width: "auto",
    minWidth: "40px", // Ensure enough width for flag and code
    display: "flex",
    alignItems: "center",
    "&:focus": {
      backgroundColor: "transparent",
    },
    "&:hover": {
      backgroundColor: "transparent",
    },
    "& .flag": {
      marginRight: "8px", // Add space between flag and code
    },
    "& .country-code": {
      marginLeft: "4px",
      padding: "0 16px 16px 0",
      color: "#374151",
      fontSize: "16px",
      fontWeight: 500,
    },
    "& .arrow": {
      display: "none", // Hide default arrow to avoid layout issues
    },
  },
  "& .country-list": {
    margin: "4px 0",
    padding: "0",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    "& .country": {
      padding: "10px 8px",
      display: "flex",
      alignItems: "center",
    },
    "& .country-name": {
      marginLeft: "8px",
    },
    "& .dial-code": {
      color: "#666",
      marginLeft: "auto",
    },
  },
  "&.phone-focused .form-control": {
    borderColor: "none",
    boxShadow: "none",
  },
  "&.phone-filled .form-control": {
    borderColor: "#none",
  },
  "& .selected-flag:hover, & .selected-flag:focus": {
    backgroundColor: "transparent",
  },
}));

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    color: "bg-gray-300",
    label: "Weak",
  });
  const [criteria, setCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [inputFocus, setInputFocus] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });
  const [inputValue, setInputValue] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });
  const [busPosition, setBusPosition] = useState({ x: 0, y: 0 });
  const [busDirection, setBusDirection] = useState({ x: 1, y: 1 });

  const navigate = useNavigate();

  useEffect(() => {
    setInputValue({
      name: form.name.length > 0,
      email: form.email.length > 0,
      phone: form.phone.length > 0,
      password: form.password.length > 0,
    });
  }, [form]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const maxWidth = window.innerWidth - 100;
      const maxHeight = window.innerHeight - 100;

      let newX = busPosition.x + busDirection.x * 50;
      let newY = busPosition.y + busDirection.y * 30;

      let newDirectionX = busDirection.x;
      let newDirectionY = busDirection.y;

      if (newX <= 0 || newX >= maxWidth) {
        newDirectionX = -busDirection.x;
        newX = Math.max(0, Math.min(newX, maxWidth));
      }

      if (newY <= 0 || newY >= maxHeight) {
        newDirectionY = -busDirection.y;
        newY = Math.max(0, Math.min(newY, maxHeight));
      }

      setBusDirection({ x: newDirectionX, y: newDirectionY });
      setBusPosition({ x: newX, y: newY });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [busPosition, busDirection]);

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

  const busVariants = {
    initial: { x: 0, y: 0 },
    animate: {
      x: busPosition.x,
      y: busPosition.y,
      transition: {
        type: "spring",
        stiffness: 30,
        damping: 10,
        duration: 4,
      },
    },
  };

  const smokeVariants = {
    initial: { opacity: 0.6, scale: 0.1 },
    animate: {
      opacity: 0,
      scale: 1.5,
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeOut",
        repeatType: "restart",
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
    hover: { scale: 1.05, boxShadow: "0 10px 15px rgba(255, 107, 0, 0.2)" },
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

  const checkPasswordStrength = (password) => {
    let strength = { score: 0, color: "bg-gray-300", label: "Weak" };
    let newCriteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    };

    strength.score = Object.values(newCriteria).filter(Boolean).length;

    
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

    setCriteria(newCriteria);
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setForm({ ...form, password });
    setPasswordStrength(checkPasswordStrength(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Ensure phone is in E.164 format (starts with +)
    const formData = { ...form };
    if (formData.phone && !formData.phone.startsWith("+")) {
      formData.phone = "+" + formData.phone;
    }

    try {
      await axios.post("/api/auth/register", formData);
      setRegisterSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brightYellow/30 via-white to-deepOrange/20"></div>

        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-softPeach opacity-30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -10, 0],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        ></motion.div>
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-deepOrange opacity-20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 15, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            delay: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        ></motion.div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544V0h.284zM0 5.373l25.456 25.455-1.414 1.415L0 8.2V5.374zm0 5.656l22.627 22.627-1.414 1.414L0 13.86v-2.83zm0 5.656l19.8 19.8-1.415 1.413L0 19.514v-2.83zm0 5.657l16.97 16.97-1.414 1.415L0 25.172v-2.83zM0 28l14.142 14.142-1.414 1.414L0 30.828V28zm0 5.657L11.314 44.97 9.9 46.386l-9.9-9.9v-2.828zm0 5.657L8.485 47.8 7.07 49.212 0 42.143v-2.83zm0 5.657l5.657 5.657-1.414 1.415L0 47.8v-2.83zm0 5.657l2.828 2.83-1.414 1.413L0 53.456v-2.83zM54.627 60L30 35.373 5.373 60H8.2L30 38.2 51.8 60h2.827zm-5.656 0L30 41.03 11.03 60h2.828L30 43.858 46.142 60h2.83zm-5.656 0L30 46.686 16.686 60h2.83L30 49.515 40.485 60h2.83zm-5.657 0L30 52.343 22.344 60h2.83L30 55.172 34.828 60h2.83zM32 60l-2-2-2 2h4zM59.716 0l-28 28 1.414 1.414L60 2.544V0h-.284zM60 5.373L34.544 30.828l1.414 1.415L60 8.2V5.374zm0 5.656L37.373 33.656l1.414 1.414L60 13.86v-2.83zm0 5.656l-19.8 19.8 1.415 1.413L60 19.514v-2.83zm0 5.657l-16.97 16.97 1.414 1.415L60 25.172v-2.83zM60 28L45.858 42.142l1.414 1.414L60 30.828V28zm0 5.657L48.686 44.97l1.415 1.415 9.9-9.9v-2.828zm0 5.657L51.515 47.8l1.414 1.414L60 42.143v-2.83zm0 5.657l-5.657 5.657 1.414 1.415L60 47.8v-2.83zm0 5.657l-2.828 2.83 1.414 1.413L60 53.456v-2.83zM39.9 16.385l1.414-1.414L30 3.658 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413L30 11.8l7.07 7.414z' fill='%23ff6b00' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        ></div>

        <motion.div
          className="absolute z-10"
          variants={busVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div
            className="absolute -right-4 top-1/2 w-8 h-8 rounded-full bg-gray-400 blur-md"
            variants={smokeVariants}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="absolute -right-6 top-1/3 w-6 h-6 rounded-full bg-gray-400 blur-md"
            variants={smokeVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          />
          <motion.div
            className="absolute -right-8 top-2/3 w-5 h-5 rounded-full bg-gray-400 blur-md"
            variants={smokeVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
          />

          <motion.img
            src="/assets/bus-icon.svg"
            alt="Roaming Bus"
            className="h-12 opacity-70"
            style={{
              filter: "drop-shadow(0px 3px 3px rgba(0,0,0,0.3))",
              transform: "scaleX(-1)",
            }}
            whileHover={{ scale: 1.2, rotate: 5 }}
          />
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-900/10 to-transparent"></div>
      </div>

      <motion.div
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur-sm bg-white/90 border border-gray-100 my-8 relative z-10 overflow-y-auto max-h-[90vh] scroll-smooth"
        initial="hidden"
        animate="visible"
        variants={formVariants}
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-brightYellow via-deepOrange to-sunsetOrange"></div>
        <motion.img
          variants={childVariants}
          src={gosyncLogo}
          alt="GoSync Logo"
          className="mx-auto w-24 mb-3 drop-shadow-md"
          whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
        />
        <motion.h2
          variants={childVariants}
          className="text-2xl font-bold text-darkCharcoal text-center mb-3"
        >
          Create Your GoSync Account
        </motion.h2>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="relative mb-2"
            >
              <motion.p
                className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-200 shadow-sm"
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
          className="space-y-3"
          variants={childVariants}
        >
          <motion.div className="relative" variants={childVariants}>
            <AnimatePresence>
              {inputFocus.name || inputValue.name ? (
                <motion.label
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute text-xs font-medium text-brightYellow z-10 left-2 bg-white px-1"
                >
                  Full Name
                </motion.label>
              ) : null}
            </AnimatePresence>

            <motion.input
              type="text"
              placeholder={inputFocus.name ? "" : "Full Name"}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setInputFocus({ ...inputFocus, name: true })}
              onBlur={() => setInputFocus({ ...inputFocus, name: false })}
              className={`w-full p-2 pl-5 border rounded-lg focus:outline-none transition-all duration-300 ${
                inputFocus.name
                  ? "border-brightYellow ring-2 ring-brightYellow/30 shadow-md"
                  : inputValue.name
                    ? "border-green-400"
                    : "border-gray-300"
              }`}
              required
              animate={inputFocus.name ? { scale: 1.01 } : { scale: 1}}
            />

            <motion.div
              className={`absolute left-0 bottom-0 h-0.5 ${
                inputValue.name && !inputFocus.name
                  ? "bg-green-400"
                  : "bg-brightYellow"
              }`}
              initial={{ width: "0%" }}
              animate={{
                width: inputFocus.name || inputValue.name ? "100%" : "0%",
              }}
              transition={{ duration: 0.3 }}
            />

            <AnimatePresence>
              {inputValue.name && !inputFocus.name && (
                <motion.span
                  className="absolute right-3 top-4 text-green-500"
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setInputFocus({ ...inputFocus, email: true })}
              onBlur={() => setInputFocus({ ...inputFocus, email: false })}
              className={`w-full p-2 pl-5 border rounded-lg focus:outline-none transition-all duration-300 ${
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
              className={`absolute left-0 bottom-0 h-0.5 ${
                inputValue.email && !inputFocus.email
                  ? "bg-green-400"
                  : "bg-brightYellow"
              }`}
              initial={{ width: "0%" }}
              animate={{
                width: inputFocus.email || inputValue.email ? "100%" : "0%",
              }}
              transition={{ duration: 0.3 }}
            />

            <AnimatePresence>
              {inputValue.email && !inputFocus.email && (
                <motion.span
                  className="absolute right-3 top-4 text-green-500"
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
              {inputFocus.phone || inputValue.phone ? (
                <motion.label
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute text-xs font-medium text-brightYellow z-20 left-2 bg-white px-1"
                  style={{ top: "-10px" }}
                >
                  Phone
                </motion.label>
              ) : null}
            </AnimatePresence>

            <div className="relative">
              <StyledPhoneInput
                country={"lk"}
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone: "+" + phone })}
                onFocus={() => setInputFocus({ ...inputFocus, phone: true })}
                onBlur={() => setInputFocus({ ...inputFocus, phone: false })}
                containerClass="w-full"
                inputClass={`w-full p-2 pl-8 border-1  rounded-lg focus:outline-none transition-all duration-300 ${
                  inputFocus.phone
                    ? "border-brightYellow"
                    : inputValue.phone
                      ? "border-green-400"
                      : "border-gray-300"
                }`}
                buttonClass="absolute top-0 left-0 h-full focus:outline-none border-r border-gray-300 px-2 flex items-center justify-center rounded-l-lg"
                dropdownClass="absolute z-50 bg-white shadow-lg rounded-lg mt-8 left-0 w-[300px] max-h-[200px] overflow-y-auto"
                searchClass="p-2 border-b"
                countryCodeEditable={false}
                enableSearch={true}
                disableSearchIcon={false}
                required
                specialLabel=""
                preferredCountries={["lk", "in", "us", "gb"]}
              />

              {/* Add focus ring effect consistent with other inputs */}
              {inputFocus.phone && (
                <div className="absolute inset-0 rounded-lg ring-2 ring-brightYellow/30 shadow-md pointer-events-none"></div>
              )}

              <motion.div
                className={`absolute left-0 bottom-0 h-1 w-full ${
                  inputValue.phone && !inputFocus.phone
                    ? "bg-green-400"
                    : "bg-brightYellow"
                }`}
                initial={{ width: "0%" }}
                animate={{
                  width: inputFocus.phone || inputValue.phone ? "100%" : "0%",
                }}
                transition={{ duration: 0.3 }}
              />

              <AnimatePresence>
                {inputValue.phone && !inputFocus.phone && (
                  <motion.span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 z-10"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={iconVariants}
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
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
              value={form.password}
              onChange={handlePasswordChange}
              onFocus={() => setInputFocus({ ...inputFocus, password: true })}
              onBlur={() => setInputFocus({ ...inputFocus, password: false })}
              className={`w-full p-2 pl-5 border rounded-lg focus:outline-none transition-all duration-300 ${
                inputFocus.password
                  ? "border-brightYellow ring-2 ring-brightYellow/30 shadow-md"
                  : "border-gray-300"
              }`}
              required
              animate={inputFocus.password ? { scale: 1.01 } : { scale: 1 }}
            />

            <motion.div
              className={`absolute left-0 bottom-0 h-0.5 bg-brightYellow`}
              initial={{ width: "0%" }}
              animate={{ width: inputFocus.password ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <motion.div
            className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
            variants={childVariants}
          >
            <motion.div
              className={`h-full ${passwordStrength.color} transition-all duration-300`}
              animate={{
                width: `${passwordStrength.score * 25}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.div
            className="flex justify-between items-center"
            variants={childVariants}
          >
            <motion.p
              className={`text-xs font-bold ${passwordStrength.color.replace(
                "bg-",
                "text-"
              )}`}
              animate={{
                scale: passwordStrength.score > 0 ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {passwordStrength.label}
            </motion.p>
            <motion.p className="text-xs text-gray-500">
              {passwordStrength.score}/4 criteria met
            </motion.p>
          </motion.div>

          <motion.div
            className="text-xs mt-1 grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg"
            variants={childVariants}
          >
            <motion.p
              className={`flex items-center ${
                criteria.length ? "text-green-600" : "text-gray-500"
              }`}
              animate={{ x: criteria.length ? [5, 0] : 0 }}
              transition={{ duration: 0.3, ease: "backOut" }}
            >
              <motion.span
                className={`inline-block w-4 h-4 mr-2 rounded-full ${
                  criteria.length ? "bg-green-600" : "bg-gray-300"
                }`}
                animate={{ scale: criteria.length ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
              8+ characters
            </motion.p>
            <motion.p
              className={`flex items-center ${
                criteria.uppercase ? "text-green-600" : "text-gray-500"
              }`}
              animate={{ x: criteria.uppercase ? [5, 0] : 0 }}
              transition={{ duration: 0.3, ease: "backOut" }}
            >
              <motion.span
                className={`inline-block w-4 h-4 mr-2 rounded-full ${
                  criteria.uppercase ? "bg-green-600" : "bg-gray-300"
                }`}
                animate={{ scale: criteria.uppercase ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
              Uppercase letter
            </motion.p>
            <motion.p
              className={`flex items-center ${
                criteria.number ? "text-green-600" : "text-gray-500"
              }`}
              animate={{ x: criteria.number ? [5, 0] : 0 }}
              transition={{ duration: 0.3, ease: "backOut" }}
            >
              <motion.span
                className={`inline-block w-4 h-4 mr-2 rounded-full ${
                  criteria.number ? "bg-green-600" : "bg-gray-300"
                }`}
                animate={{ scale: criteria.number ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
              Number
            </motion.p>
            <motion.p
              className={`flex items-center ${
                criteria.specialChar ? "text-green-600" : "text-gray-500"
              }`}
              animate={{ x: criteria.specialChar ? [5, 0] : 0 }}
              transition={{ duration: 0.3, ease: "backOut" }}
            >
              <motion.span
                className={`inline-block w-4 h-4 mr-2 rounded-full ${
                  criteria.specialChar ? "bg-green-600" : "bg-gray-300"
                }`}
                animate={{ scale: criteria.specialChar ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
              Special character
            </motion.p>
          </motion.div>

          <motion.button
            type="submit"
            className={`w-full py-2 px-4 rounded-lg text-white font-bold transition-all duration-300 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : registerSuccess
                  ? "bg-green-500"
                  : "bg-deepOrange hover:bg-brightYellow hover:shadow-lg"
            }`}
            disabled={isLoading}
            variants={buttonVariants}
            initial="idle"
            animate={
              isLoading ? "loading" : registerSuccess ? "success" : "idle"
            }
            whileHover={!isLoading && !registerSuccess ? "hover" : ""}
            whileTap={!isLoading && !registerSuccess ? "tap" : ""}
          >
            {isLoading
              ? "Registering..."
              : registerSuccess
                ? "Success!"
                : "Register"}
          </motion.button>
        </motion.form>

        <motion.p
          className="text-sm text-center text-gray-500 mt-4"
          variants={childVariants}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brightYellow hover:text-deepOrange font-medium"
          >
            Log in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;