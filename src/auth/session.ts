const ACCESS_TOKEN_KEY = 'alpool_admin_access_token';

export function getAccessToken(): string | null {
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAccessToken(token: string): void {
  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // A blocked storage should not expose the token or crash the app.
  }
}

export function clearAccessToken(): void {
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Storage cleanup is best effort in restricted browser contexts.
  }
}
