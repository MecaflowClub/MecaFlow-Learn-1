// Utilitaires pour gestion des tokens JWT et refresh

// Stocke le token et le refresh_token après login
export function storeTokens(access_token, refresh_token) {
  localStorage.setItem("token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
}

// Rafraîchit le token d'accès avec le refresh_token
export async function refreshAccessToken() {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) return null;
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    return data.access_token;
  }
  return null;
}

// Utilise le token, rafraîchit si besoin
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("token");
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    // Token expiré, tente le refresh
    token = await refreshAccessToken();
    if (token) {
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }
  return res;
}