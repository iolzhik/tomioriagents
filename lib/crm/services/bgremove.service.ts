/**
 * Background removal service.
 * Primary: remove.bg API (if REMOVE_BG_API_KEY is set)
 * Fallback: local REMBG sidecar (if REMBG_URL is set)
 * Last resort: returns error so the client can use canvas-based removal
 */

export async function removeBackground(
  imageBase64: string
): Promise<{ success: true; resultBase64: string } | { success: false; error: string }> {
  // Check decoded size (base64 encodes ~4/3 bytes)
  const decodedSize = Math.floor((imageBase64.length * 3) / 4);
  const maxSize = 12 * 1024 * 1024; // 12 MB
  if (decodedSize > maxSize) {
    return { success: false, error: 'Image exceeds maximum size of 12MB' };
  }

  const removeBgKey = process.env.REMOVE_BG_API_KEY;
  const rembgUrl = process.env.REMBG_URL;

  if (removeBgKey && removeBgKey !== 'your_api_key_here') {
    try {
      const formData = new FormData();
      formData.append('image_file_b64', imageBase64);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': removeBgKey },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: errText || `remove.bg error: ${response.status}` };
      }

      const buffer = await response.arrayBuffer();
      const resultBase64 = Buffer.from(buffer).toString('base64');
      return { success: true, resultBase64 };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (rembgUrl) {
    try {
      const response = await fetch(rembgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: errText || `rembg error: ${response.status}` };
      }

      const data = await response.json();
      const resultBase64: string = data.result_b64 ?? data.resultBase64 ?? data.image_base64 ?? data.result;
      return { success: true, resultBase64 };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { success: false, error: 'BG removal service not configured' };
}
