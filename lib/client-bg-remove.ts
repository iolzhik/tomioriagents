/**
 * Client-side background removal using Canvas API.
 * Simple chroma-key algorithm: removes pixels similar to corner colors.
 * Works best with solid/uniform backgrounds.
 */

export async function removeBackgroundClient(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample corner colors to detect background
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 },
      ];

      const bgColors = corners.map(c => {
        const idx = (c.y * canvas.width + c.x) * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
      });

      // Average corner color as background reference
      const avgBg = {
        r: Math.round(bgColors.reduce((s, c) => s + c.r, 0) / bgColors.length),
        g: Math.round(bgColors.reduce((s, c) => s + c.g, 0) / bgColors.length),
        b: Math.round(bgColors.reduce((s, c) => s + c.b, 0) / bgColors.length),
      };

      // Remove pixels similar to background
      const threshold = 40; // Color distance threshold
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt(
          Math.pow(r - avgBg.r, 2) +
          Math.pow(g - avgBg.g, 2) +
          Math.pow(b - avgBg.b, 2)
        );

        if (dist < threshold) {
          data[i + 3] = 0; // Make transparent
        } else if (dist < threshold * 1.5) {
          // Feather edge
          data[i + 3] = Math.round(((dist - threshold) / (threshold * 0.5)) * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
