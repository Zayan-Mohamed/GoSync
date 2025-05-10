import React from "react";
import { Button as MuiButton } from "@mui/material";

const Button = ({ variant = "primary", className = "", children, ...props }) => {
  const getVariantStyles = () => {
    const baseStyles = {
      textTransform: "none",
      fontSize: "0.813rem",
      fontWeight: 500,
      borderRadius: "6px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      padding: "6px 12px",
      boxShadow: "none",
      minWidth: props.minWidth || "auto",
      height: props.height || "32px",
      position: "relative",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",

      "& .MuiSvgIcon-root": {
        fontSize: "1.15rem",
      },
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyles,
          backgroundColor: "#E65100",
          color: "#fff",
          border: "1px solid #E65100",
          "&:hover": {
            backgroundColor: "#F57C00",
            borderColor: "#F57C00",
            transform: "translateY(-1px)",
            boxShadow: "0 2px 6px rgba(230, 81, 0, 0.2)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 1px 2px rgba(230, 81, 0, 0.2)",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F1F5F9",
            borderColor: "#E2E8F0",
            color: "#94A3B8",
          },
        };
      case "secondary":
        return {
          ...baseStyles,
          backgroundColor: "#FFF",
          color: "#E65100",
          border: "1px solid #E65100",
          "&:hover": {
            backgroundColor: "#FFF3E0",
            borderColor: "#F57C00",
            color: "#F57C00",
            transform: "translateY(-1px)",
            boxShadow: "0 2px 6px rgba(230, 81, 0, 0.1)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 1px 2px rgba(230, 81, 0, 0.1)",
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
          border: "1px solid #DC2626",
          "&:hover": {
            backgroundColor: "#FEE2E2",
            transform: "translateY(-1px)",
            boxShadow: "0 2px 6px rgba(220, 38, 38, 0.1)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 1px 2px rgba(220, 38, 38, 0.1)",
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
          border: "1px solid #E2E8F0",
          "&:hover": {
            backgroundColor: "#F1F5F9",
            borderColor: "#CBD5E1",
            color: "#475569",
            transform: "translateY(-1px)",
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
