import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://31.97.144.132:4000';

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from the query parameters or session
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      );
    }

    // First, verify the document belongs to the user
    const documentResponse = await fetch(`${baseUrl}/api/documents/${id}?user_id=${userId}`, {
      headers: {
        'Cookie': `session_token=${sessionToken.value}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!documentResponse.ok) {
      if (documentResponse.status === 404) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify document access' },
        { status: documentResponse.status }
      );
    }

    const document = await documentResponse.json();

    // Now fetch the actual file from the backend
    const fileResponse = await fetch(`${baseUrl}/uploads/${document.filename}`, {
      headers: {
        'Cookie': `session_token=${sessionToken.value}`,
      },
      credentials: 'include',
    });

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the file content and headers
    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || document.mime_type || 'application/octet-stream';

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${document.original_name || document.filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
