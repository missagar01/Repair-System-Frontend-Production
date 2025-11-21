  const API_URL = import.meta.env.VITE_API_BASE_URL;


export const authenticateUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }

    return {
      id: data.user.id,
      name: data.user.name,
      role: data.user.role,
      access: data.user.access, // array
    };

  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};
