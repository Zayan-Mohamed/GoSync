import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";

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
      const userRole = useAuthStore.getState().user?.role; // ✅ Get user role
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

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default Login;
