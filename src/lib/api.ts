export async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  
  if (response.status === 403) {
    const clone = response.clone();
    const data = await clone.json();
    if (data.message === 'LICENSE_EXPIRED') {
      window.dispatchEvent(new CustomEvent('license-expired'));
    }
  }
  
  return response;
}
