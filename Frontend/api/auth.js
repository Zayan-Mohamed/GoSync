// Helper function to get API URL with fallbacks
const getApiUrl = () => {
  // Check if we have a runtime API URL (set by the container)
  if (window.RUNTIME_API_URL) {
    console.log("Using runtime API URL for auth:", window.RUNTIME_API_URL);
    return window.RUNTIME_API_URL;
  }

  // Try to get from environment variable
  const envApiUrl = import.meta.env.VITE_API_URL;

  // Check if we're running in production or development
  const isProduction = import.meta.env.PROD === true;
  const hostname = window.location.hostname;

  // Choose appropriate fallback based on environment and hostname
  let fallbackUrl;
  if (isProduction) {
    // In production, use the same hostname as the frontend but with backend port
    fallbackUrl = `//${hostname}:5000`;
  } else {
    // In development
    fallbackUrl = "http://localhost:5000";
  }

  console.log(
    `Auth using ${envApiUrl || fallbackUrl} (${isProduction ? "production" : "development"} mode)`
  );

  // Use environment variable if available, otherwise use fallback
  return envApiUrl || fallbackUrl;
};

export const login = async (email, password) => {
  const API_URI = getApiUrl();
  console.log("Login request to:", `${API_URI}/api/users/login`);

  try {
    const response = await fetch(`${API_URI}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Important for cookies
    });

    const data = await response.json();
    console.log("Login Response:", data); // ✅ Debugging

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return { success: true, user: data };
  } catch (error) {
    console.log("Login error:", error.message);
    return { success: false, message: error.message };
  }
};
