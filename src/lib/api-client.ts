export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

async function extractErrorMessage(res: Response): Promise<string> {
  const fallback = `${res.status} ${res.statusText || 'Error'}`.trim();
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as { error?: string; message?: string };
      return data.error || data.message || fallback;
    }
    const text = (await res.text()).trim();
    if (!text || text.startsWith('<')) return fallback;
    return text.length > 200 ? text.slice(0, 200) + '…' : text;
  } catch {
    return fallback;
  }
}
