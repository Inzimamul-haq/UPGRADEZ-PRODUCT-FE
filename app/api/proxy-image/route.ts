import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/proxy-image?url=<encoded-image-url>
 *
 * Server-side image proxy to bypass CORS restrictions when fetching
 * college logos from R2/Supabase storage for PDF generation.
 * Returns the image as a base64 data URL string.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Basic allowlist: only allow fetching from our own storage domains
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const allowedHosts = [
    'r2.dev',
    'cloudflare.com',
    'supabase.co',
    'supabase.in',
    'amazonaws.com',
    'up-gradez.com',
  ];

  const isAllowed = allowedHosts.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );

  if (!isAllowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    const imageRes = await fetch(url, { next: { revalidate: 3600 } });

    if (!imageRes.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${imageRes.status}` },
        { status: 502 }
      );
    }

    const contentType = imageRes.headers.get('content-type') || 'image/png';
    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error('[proxy-image] Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
