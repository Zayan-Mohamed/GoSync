import React from "react";
import { motion } from "framer-motion";

const GoSyncLoader = () => {
  // Define animation variants for the bus
  const busVariants = {
    move: {
      x: [0, 20, 0], // Bus moves side to side
      rotate: [0, 5, -5, 0], // Slight tilt for realism
      transition: {
        x: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
      },
    },
  };

  // Define animation for the wheels
  const wheelVariants = {
    spin: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
    },
  };

  // Define text animation
  const textVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-white to-gray-200">
      {/* Bus Animation */}
      <motion.div
        className="relative flex items-center justify-center"
        variants={busVariants}
        animate="move"
      >
        {/* Bus Body */}
        <div className="w-28 h-16 bg-blue-600 rounded-lg shadow-lg relative">
          {/* Windows */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-sm" />
          <div className="absolute top-2 left-8 w-4 h-4 bg-white rounded-sm" />
          <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-sm" />
          {/* Front Windshield */}
          <div className="absolute top-0 right-0 w-6 h-16 bg-gray-300 rounded-r-lg" />
        </div>

        {/* Wheels */}
        <motion.div
          className="absolute -bottom-4 left-2 w-8 h-8 bg-gray-800 rounded-full border-4 border-yellow-400"
          variants={wheelVariants}
          animate="spin"
        />
        <motion.div
          className="absolute -bottom-4 right-2 w-8 h-8 bg-gray-800 rounded-full border-4 border-yellow-400"
          variants={wheelVariants}
          animate="spin"
        />
      </motion.div>

      {/* GoSync Text */}
      <motion.div
        className="mt-8 text-gray-800 text-2xl font-bold tracking-wide"
        variants={textVariants}
        animate="pulse"
      >
        GoSync
      </motion.div>

      {/* Loading Message */}
      <motion.div
        className="mt-2 text-gray-600 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Booking Your Ride...
      </motion.div>
    </div>
  );
};

export default GoSyncLoader;
