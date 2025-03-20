export const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      console.log("Login Response:", data); // ✅ Debugging
  
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
  
      return { success: true, user: data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  