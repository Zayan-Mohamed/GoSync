import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-[#F5F5F5] h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
