
// src/app/api/download-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const imageBlob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', imageBlob.type);
    headers.set('Content-Disposition', `attachment; filename="qr-code.png"`);

    return new NextResponse(imageBlob, { status: 200, headers });
  } catch (error) {
    console.error('Error proxying image download:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
