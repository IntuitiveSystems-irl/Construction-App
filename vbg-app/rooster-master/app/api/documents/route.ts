import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://31.97.144.132:4000';

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing user_id parameter' },
      { status: 400 }
    );
  }

  try {
    // Forward the request to the backend server
    const backendUrl = `${baseUrl}/api/documents?user_id=${userId}`;
    const response = await fetch(backendUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Cookie': request.headers.get('Cookie') || '',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: response.status }
      );
    }

    const documents = await response.json();
    
    // Define the document type
    interface Document {
      id: number;
      user_id: number;
      filename: string;
      original_name: string;
      name?: string;
      description?: string;
      type?: string;
      uploaded_at?: string;
      expires_at?: string;
      size?: number;
      document_url?: string;
    }

    // Transform the documents to include authenticated URLs
    const documentsWithUrls = documents.map((doc: Document) => ({
      ...doc,
      // Use the authenticated serve endpoint instead of direct uploads access
      document_url: doc.document_url?.startsWith('http')
        ? doc.document_url
        : `/api/documents/${doc.id}/serve?user_id=${userId}`,
      // Ensure we have a name field (use original_name if available)
      name: doc.name || doc.original_name || 'Unnamed Document',
      // Ensure we have a type field
      type: doc.type || 'other',
      // Ensure we have an uploaded_at field
      uploaded_at: doc.uploaded_at || new Date().toISOString()
    }));

    return NextResponse.json(documentsWithUrls);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('id');
  
  if (!documentId) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 }
    );
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://31.97.144.132:4000';
    const response = await fetch(`${backendUrl}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to delete document' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
