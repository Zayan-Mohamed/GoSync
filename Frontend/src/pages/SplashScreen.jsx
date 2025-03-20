// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import gosyncLogo from "/assets/GoSync.png";

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      navigate("/login");
    }, 4000); // Show splash for 4 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-center h-screen bg-white relative overflow-hidden">
      {/* Soft Glowing Circle */}
      <motion.div
        className="absolute w-80 h-80 bg-brightYellow rounded-full opacity-20 blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Animated Logo */}
      <motion.img
        src={gosyncLogo}
        alt="GoSync Logo"
        className="w-40 drop-shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1] }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Text */}
      <motion.h1
        className="absolute bottom-20 mb-5 text-darkCharcoal text-4xl font-extrabold tracking-wide soft-glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 1], y: [20, 0, -5] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
      >
        Welcome to GoSync
      </motion.h1>

      <motion.p
        className="absolute bottom-16 text-darkCharcoal text-lg font-medium tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1], y: [10, 0] }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        "Your Ride, Your Time, Synced Perfectly."
      </motion.p>
    </div>
  );
};

export default SplashScreen;
