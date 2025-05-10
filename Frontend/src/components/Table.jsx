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
  const tableStyles = {
    container: {
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      backgroundColor: '#fff',
    },
    header: {
      cell: {
        background: 'linear-gradient(to right, #FFE082, #FFC107)',
        color: '#333',
        fontWeight: 600,
        fontSize: '0.813rem',
        borderBottom: '2px solid #E2E8F0',
        padding: '12px 16px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        '&:first-of-type': {
          borderTopLeftRadius: '8px',
        },
        '&:last-of-type': {
          borderTopRightRadius: '8px',
        }
      }
    },
    body: {
      row: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': highlightOnHover ? {
          backgroundColor: '#F8FAFC',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 4px rgba(148, 163, 184, 0.05)',
          '& td': {
            color: '#1E293B',
          }
        } : {},
        '&:last-child td': {
          borderBottom: 'none',
        },
      },
      cell: {
        padding: '12px 16px',
        borderBottom: '1px solid #E2E8F0',
        fontSize: '0.875rem',
        color: '#475569',
        transition: 'all 0.2s ease',
        '&:first-of-type': {
          paddingLeft: '20px',
        },
        '&:last-of-type': {
          paddingRight: '20px',
        }
      }
    }
  };

  // If columns and data are provided, use them
  if (columns && data) {
    return (
      <TableContainer component={Paper} elevation={0} className={className} sx={tableStyles.container}>
        <MuiTable>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index} sx={tableStyles.header.cell}>
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={tableStyles.body.row}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} sx={tableStyles.body.cell}>
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