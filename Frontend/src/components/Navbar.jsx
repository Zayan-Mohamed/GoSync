import { FiBell, FiSearch, FiSettings, FiUser, FiLogOut } from "react-icons/fi";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center space-x-3">
        <FiSearch size={20} />
        <input
          type="text"
          placeholder="Search..."
          className="border-b outline-none"
        />
      </div>
      

{/* Right Section - Icons and Buttons */}
      <div className="flex items-center space-x-4">
        <button className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition">Add an Admin</button>
        <button><FiBell size={24} /></button>
        <button><FiSettings size={24} /></button>
        <button className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FiUser size={24} />
        </button>
        <button className="flex items-center space-x-2 text-red-500 hover:text-red-700">
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );
};

export default Navbar;
