import AppRoute from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <AppRoute />
    </AuthProvider>
  );
}

export default App;
