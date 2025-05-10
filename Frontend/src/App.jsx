import AppRoute from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";


function App() {
  return (
    <AuthProvider>
      <AppRoute />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </AuthProvider>
  );
}

export default App;
