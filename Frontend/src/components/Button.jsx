import React from "react";

const Button = ({ children, className, variant = "primary", ...props }) => {
  const baseClasses =
    "px-4 py-2 rounded transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-[#E65100] hover:bg-[#FF8F00] text-white focus:ring-[#E65100]",
    secondary:
      "bg-[#FFD600] hover:bg-[#FFC107] text-[#212121] focus:ring-[#FFD600]",
    danger: "bg-[#D32F2F] hover:bg-[#B71C1C] text-white focus:ring-[#D32F2F]",
    light:
      "bg-[#F5F5F5] hover:bg-[#FFE082] text-[#212121] focus:ring-[#FFE082]",
  };

  const variantClasses = variants[variant] || variants.primary;

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
