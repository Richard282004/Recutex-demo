/*
  Serves product photos from MEDIA_DIR (downloaded by `npm run db:seed`). next/image optimises them
  on request (resize + WebP/AVIF) and caches the result, so these originals are fetched rarely.
  In production the same URLs can be served by object storage or a CDN instead.
*/
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { NextRequest } from 'next/server';

const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR ?? 'storage/media');
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  const file = path.resolve(MEDIA_DIR, ...segments);
  const type = TYPES[path.extname(file).toLowerCase()];
  // Only image files inside MEDIA_DIR: blocks "../" traversal and non-image files like manifest.json.
  if (!type || !file.startsWith(MEDIA_DIR + path.sep)) return new Response('Not found', { status: 404 });

  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        'Content-Type': type,
        // A re-seed can replace a photo under the same name, so cache for a day, not forever.
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
