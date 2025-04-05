import { useState } from "react";
import { FiMenu, FiHome, FiSettings, FiLogOut, FiMapPin, FiMap, FiTruck, FiCalendar, FiUserCheck, FiBell, FiPlus } from "react-icons/fi";
import { TbReportSearch } from "react-icons/tb";
import { CgNotes } from "react-icons/cg";
import { BsGraphUp , BsGraphUpArrow } from "react-icons/bs";
import { MdAutoGraph } from "react-icons/md";
import { SlGraph } from "react-icons/sl";
import { GoGraph } from "react-icons/go";
import { VscGraphLine, VscGraphScatter } from "react-icons/vsc";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import SidebarSection from "./SidebarSection";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sections = [
    {
      title: "Dashboard",
      links: [{ to: "/admin", label: "GoSync Dashboard", icon: <FiHome /> }],
    },
    {
      title: "Stop and Route Management",
      links: [
        { to: "/stop-management", label: "Current Stops", icon: <FiMapPin /> },
        { to: "/add-stop", label: "Add Stop", icon: <FiPlus /> },
        { to: "/stop-analytics", label: "Stop Analytics", icon: <VscGraphScatter /> },
        { to: "/current-routes", label: "Current Routes", icon: <FiMap /> },
        { to: "/add-routes", label: "Add Routes", icon: <FiPlus /> },
        { to: "/route-stops", label: "Manage Route Stops", icon: <BsGraphUp /> },
        { to: "/route-analytics", label: "Route Analytics", icon: <BsGraphUp /> },
      ],
    },
    {
      title: "Bus Management",
      links: [
        { to: "/bus-management", label: "Current Buses", icon: <FiTruck /> },
        { to: "/add-bus", label: "Add Bus", icon: <FiPlus /> },
        { to: "/bus-analytics", label: "Bus Analytics", icon: <MdAutoGraph /> },
      ],
    },
    {
      title: "Schedule Management",
      links: [
        { to: "/schedule-management", label: "Current Schedule", icon: <FiCalendar /> },
        { to: "/add-schedule", label: "Insert Schedule", icon: <FiPlus /> },
        { to: "/schedule-analytics", label: "Schedule Analytics", icon: <BsGraphUpArrow /> },
      ],
    },
    {
      title: "Seat and Booking Management",
      links: [
        { to: "/seat-management", label: "Current Seats", icon: <FiUserCheck /> },
        { to: "/add-seat", label: "Add Seat", icon: <FiPlus /> },
        { to: "/seat-analytics", label: "Seat Analytics", icon: <VscGraphLine /> },
        { to: "/booking-management", label: "Current Bookings", icon: <FiUserCheck /> },
        { to: "/add-booking", label: "Add Booking", icon: <FiPlus /> },
        { to: "/booking-analytics", label: "Booking Analytics", icon: <SlGraph /> },
      ],
    },
    {
      title: "Notification Management",
      links: [
        { to: "/notification-management", label: "Current Notifications", icon: <FiBell /> },
        { to: "/Schedule-notification", label: "Schedule Notifications", icon: <FiBell /> },
        { to: "/add-notification", label: "Add Notification", icon: <FiPlus /> },
        { to: "/notification-analytics", label: "Notification Analytics", icon: <GoGraph /> },
      ],
    },
    {
      title: "Notices",
      links: [{ to: "/notices", label: "Current Notices", icon: <CgNotes /> }],
    },
    {
      title: "Analytics",
      links: [{ to: "/analytics", label: "Analytics Overview", icon: <TbReportSearch /> }],
    },
  ];

  return (
    <div className={`bg-[#FFE082] h-screen flex flex-col transition-all overflow-hidden duration-300 ${collapsed ? "w-16" : "w-64 md:w-72 lg:w-80"}`}>
      <div className="flex items-center p-4">
        <button onClick={() => setCollapsed(!collapsed)} className="mr-3 mt-6">
          <FiMenu size={24} />
        </button>
        {!collapsed && (
          <img src="/assets/GoSync-Logo_Length2.png" alt="GoSync Logo" className="h-10 w-auto ml-8 mt-3 hidden sm:block" />
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {sections.map((section, index) => (
          <SidebarSection key={index} title={section.title} links={section.links} collapsed={collapsed} />
        ))}
      </div>

      <div className="p-4">
        <ul className="space-y-4">
          <li>
            <Link to="/settings" className="flex items-center space-x-3">
              <FiSettings size={20} />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="flex items-center space-x-3">
              <FiLogOut size={20} />
              {!collapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
