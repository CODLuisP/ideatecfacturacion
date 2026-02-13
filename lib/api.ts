import { getSession } from 'next-auth/react';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && {
        Authorization: `Bearer ${session.accessToken}`,
      }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error: ${response.statusText}`);
  }

  return response.json();
}