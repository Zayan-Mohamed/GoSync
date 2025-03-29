import React from "react";

const Table = ({ children }) => {
  return (
    <table className="w-full border-collapse border border-gray-300">
      {children}
    </table>
  );
};

export default Table;
