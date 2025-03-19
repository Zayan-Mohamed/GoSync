// import React from "react";
import { Link } from "react-router-dom";

const SidebarSection = ({ title, links, collapsed }) => {
  return (
    <div>
      {/* Show section title only when expanded */}
      {!collapsed && <h3 className="font-semibold text-lg mb-3">{title}</h3>}
      
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <Link to={link.to} className="flex items-center space-x-3">
              {/* Hide icons when collapsed */}
              {!collapsed && <span>{link.icon}</span>}
              
              {/* Show label text only when expanded */}
              {!collapsed && <span>{link.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarSection;
