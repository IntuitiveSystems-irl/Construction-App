import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://31.97.144.132:4000';
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/upload-document`, {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Upload failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
