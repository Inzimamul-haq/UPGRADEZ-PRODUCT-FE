import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/proxy-image?url=<encoded-image-url>
 *
 * Server-side image proxy to bypass CORS restrictions when fetching
 * college logos from R2/Supabase storage for PDF generation.
 * Returns the image as a base64 data URL string.
 */
export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url');
  const collegeId = req.nextUrl.searchParams.get('collegeId');

  if (!url && !collegeId) {
    return NextResponse.json({ error: 'Missing url or collegeId param' }, { status: 400 });
  }

  // If collegeId is provided but no url, fetch the college's logoUrl from the backend
  if (collegeId && !url) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const collegeRes = await fetch(`${backendUrl}/api/colleges/${collegeId}/public`);
      if (collegeRes.ok) {
        const json = await collegeRes.json();
        if (json.data?.logoUrl) {
          url = json.data.logoUrl;
        } else {
          return NextResponse.json({ error: 'College has no logo' }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: 'Failed to fetch college details' }, { status: collegeRes.status });
      }
    } catch (e) {
      console.error('[proxy-image] Failed to fetch college:', e);
      return NextResponse.json({ error: 'Failed to communicate with backend' }, { status: 500 });
    }
  }

  // We are guaranteed to have `url` here (due to TS being unsure, we assert it or check)
  if (!url) {
    return NextResponse.json({ error: 'Resolved URL is empty' }, { status: 400 });
  }



  try {
    const imageRes = await fetch(url, { next: { revalidate: 31536000 } });

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

    return NextResponse.json({ dataUrl }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000' }
    });
  } catch (err) {
    console.error('[proxy-image] Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
