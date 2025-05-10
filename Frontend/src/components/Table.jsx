import React from "react";
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const Table = ({ columns, data, className, children, highlightOnHover = false }) => {
  // If columns and data are provided, use them
  if (columns && data) {
    return (
      <TableContainer component={Paper} elevation={0} className={className}>
        <MuiTable sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={index}
                  sx={{
                    backgroundColor: "#F8FAFC",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "2px solid #E2E8F0",
                    padding: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  ...(highlightOnHover && {
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#F8FAFC",
                    },
                  }),
                  // Zebra striping
                  backgroundColor: rowIndex % 2 === 0 ? "#fff" : "#FAFAFA",
                }}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    sx={{
                      padding: "16px",
                      borderBottom: "1px solid #E2E8F0",
                      fontSize: "0.875rem",
                      color: "#1E293B",
                      "&:first-of-type": {
                        paddingLeft: "24px",
                      },
                      "&:last-of-type": {
                        paddingRight: "24px",
                      },
                    }}
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    );
  }

  // Otherwise, render children directly (for legacy usage)
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  );
};

export default Table;