// D11(a): NASA Scientific Visualization Studio CGI Moon Kit (2025 color map).
// The image is an external NASA asset, fetched during deployment rather than
// embedding binary content in the source repository.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg';
const output = fileURLToPath(new URL('../dist/moon/lroc_color_2k.jpg', import.meta.url));
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) throw new Error('NASA Moon map HTTP ' + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 400000 || bytes.length > 700000 ||
      bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new Error('NASA Moon map failed JPEG integrity/size validation');
  }
  await mkdir(fileURLToPath(new URL('../dist/moon/', import.meta.url)), { recursive: true });
  await writeFile(output, bytes);
  console.log('[D11 Moon map] NASA SVS CGI Moon Kit 2k JPEG copied: ' + bytes.length + ' bytes');
} finally {
  clearTimeout(timeout);
}
