import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const SidebarSection = ({ title, links, collapsed }) => {
  const location = useLocation();
  const sectionRef = useRef(null);

  // Check if any link in this section is active
  const isActiveSection = links.some((link) => location.pathname === link.to);

  // Scroll this section into view whenever collapse state changes or if this section is active
  useEffect(() => {
    if (isActiveSection && sectionRef.current) {
      // Always scroll when collapsed state changes and this section is active
      setTimeout(() => {
        sectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center", // Center the active section in view
        });
      }, 300); // Longer timeout to ensure transition completes
    }
  }, [isActiveSection, collapsed, location.pathname]); // Dependency on collapsed state

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-200 ${
        isActiveSection
          ? collapsed
            ? "bg-amber-500/20 py-2" // Subtle highlight when collapsed
            : "bg-amber-100 border-l-4 border-amber-500 pl-2.5 pb-3 pt-3 pr-3 rounded-md shadow-sm"
          : ""
      }`}
    >
      {/* Show section title only when expanded */}
      {!collapsed && (
        <h3
          className={`font-semibold text-lg mb-2 transition-colors ${
            isActiveSection ? "text-amber-800 font-bold" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
      )}

      {/* When expanded, show full links with icons and text */}
      {!collapsed ? (
        <ul className="space-y-1">
          {links.map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={index}>
                <Link
                  to={link.to}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all ${
                    isActive
                      ? " bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-sm"
                      : "hover:bg-amber-300 text-gray-700 hover:text-amber-700"
                  }`}
                >
                  <div
                    className={`text-[17px] ${isActive ? "text-white" : "text-amber-600"}`}
                  >
                    {link.icon}
                  </div>
                  <span className="text-sm">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        /* When collapsed, show minimal dots that indicate navigation */
        <ul className="flex flex-col items-center space-y-3 py-1">
          {links.map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={index}>
                <Link
                  to={link.to}
                  title={link.label}
                  className={`block w-2 h-2 rounded-full transition-all ${
                    isActive
                      ? "bg-amber-500 ring-2 ring-amber-300 ring-opacity-50"
                      : "bg-amber-300 hover:bg-amber-500"
                  }`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SidebarSection;
