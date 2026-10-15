/**
 * SSE Stream Fetch Client Utility
 * Streams text/event-stream chunks from FastAPI endpoints and handles JSON event objects.
 */
export async function streamFetch(endpoint, payload, onEvent, onError) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  const cleanBase = baseURL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${cleanBase}${cleanEndpoint}`;

  const token = localStorage.getItem('adaptive_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser environment.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || ''; // Hold trailing incomplete chunk in buffer

      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (onEvent) onEvent(data);
          } catch (e) {
            console.warn('[streamFetch] JSON parse chunk error:', e);
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        if (onEvent) onEvent(data);
      } catch (e) {}
    }
  } catch (err) {
    console.error('[streamFetch] Connection/Stream Error:', err);
    if (onError) onError(err);
    else throw err;
  }
}
