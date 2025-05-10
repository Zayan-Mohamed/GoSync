import React from "react";
import { Button as MuiButton } from "@mui/material";

const Button = ({ variant = "primary", className = "", children, ...props }) => {
  const getVariantStyles = () => {
    const baseStyles = {
      textTransform: "none",
      fontSize: "0.875rem",
      fontWeight: 500,
      borderRadius: "10px",
      transition: "all 0.2s ease",
      padding: "8px 16px",
      boxShadow: "none",
      minWidth: props.minWidth || "120px",
      height: props.height || "40px",
      position: "relative",
      overflow: "hidden",
      "&::after": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "transparent",
        transition: "background 0.2s ease",
      },
      "&:hover::after": {
        background: "rgba(255, 255, 255, 0.1)",
      },
      "&:active::after": {
        background: "rgba(0, 0, 0, 0.1)",
      },
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyles,
          backgroundColor: "#E65100",
          color: "#fff",
          border: "2px solid #E65100",
          "&:hover": {
            backgroundColor: "#FF8F00",
            borderColor: "#FF8F00",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(230, 81, 0, 0.2)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F1F5F9",
            borderColor: "#CBD5E1",
            color: "#94A3B8",
          },
        };
      case "secondary":
        return {
          ...baseStyles,
          backgroundColor: "#FFF",
          color: "#E65100",
          border: "2px solid #E65100",
          "&:hover": {
            backgroundColor: "#FFF3E0",
            borderColor: "#FF8F00",
            color: "#FF8F00",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(230, 81, 0, 0.1)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F8FAFC",
            borderColor: "#E2E8F0",
            color: "#94A3B8",
          },
        };
      case "danger":
        return {
          ...baseStyles,
          backgroundColor: "#FFF",
          color: "#DC2626",
          border: "2px solid #DC2626",
          "&:hover": {
            backgroundColor: "#FEE2E2",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.1)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F8FAFC",
            borderColor: "#E2E8F0",
            color: "#94A3B8",
          },
        };
      case "light":
        return {
          ...baseStyles,
          backgroundColor: "#F8FAFC",
          color: "#64748B",
          border: "2px solid #E2E8F0",
          "&:hover": {
            backgroundColor: "#F1F5F9",
            borderColor: "#CBD5E1",
            color: "#475569",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F8FAFC",
            borderColor: "#E2E8F0",
            color: "#94A3B8",
          },
        };
      default:
        return baseStyles;
    }
  };

  return (
    <MuiButton
      {...props}
      className={className}
      sx={{
        ...getVariantStyles(),
        ...(props.sx || {}),
      }}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
