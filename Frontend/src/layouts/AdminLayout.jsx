import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { ToastContainer } from "react-toastify";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-[#F5F5F5] h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">{children}
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
