import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import gosyncLogo from "/assets/GoSync.png";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login); // ✅ Access Zustand login function

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const response = await login(email, password); // ✅ Call Zustand store function

    if (!response.success) {
      setError(response.message);
    } else {
      const userRole = useAuthStore.getState().user?.role; // ✅ Get user role admin passeger
      console.log("User Role:", userRole); // Debugging

      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "passenger") {
        navigate("/passenger");
      } else {
        navigate("/unauthorized");
      }
    }
  };
//class, id  
  return (
    <div className="flex justify-center items-center min-h-screen bg-lightGray">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <img src={gosyncLogo} alt="GoSync Logo" className="mx-auto w-32 mb-4" />
        <h2 className="text-2xl font-bold text-darkCharcoal text-center mb-6">Welcome to GoSync</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-deepOrange text-white font-bold rounded-md hover:bg-sunsetOrange transition"
          >
            Login
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Don't have an account? <Link to="/register" className="text-brightYellow font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
