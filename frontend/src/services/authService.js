const API_BASE_URL = "http://localhost:5000/api";

export async function fetchCurrentUser(userId) {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}