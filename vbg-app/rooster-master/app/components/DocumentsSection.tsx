'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  name: string;
  type: string;
  document_url: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  profile_id: string;
}

export default function DocumentsSection({ profileId }: { profileId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // First verify the session by hitting the profile endpoint
        try {
          await fetch('/api/profile');
          
          // If we get here, the session is valid, now fetch documents
          const response = await fetch(`/api/documents?profile_id=${profileId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch documents');
          }
          
          const data = await response.json();
          setDocuments(data);
          setError('');
        } catch (err) {
          console.error('Session validation failed:', err);
          throw new Error('Session expired');
        }
      } catch (err) {
        console.error('Error in fetchDocuments:', err);
        // Clear any invalid tokens and redirect to login
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('user');
        setError('Your session has expired. Please log in again.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchDocuments();
    }
  }, [profileId, router]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to delete document');
      }
      
      // Remove the deleted document from the list
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Please try again.');
      if (err instanceof Error && (err.message.includes('token') || err.message.includes('401') || err.message.includes('Unauthorized'))) {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  };

  return (
    <section className="bg-white rounded shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">Documents</h2>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : documents.length === 0 ? (
        <p className="text-gray-500">No documents found</p>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded shadow-sm">
              <div>
                <h3 className="font-medium">{doc.name}</h3>
                <p className="text-sm text-gray-500">
                  Type: {doc.type} • 
                  Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                  {doc.expires_at && ` • Expires on ${new Date(doc.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <a
                  href={doc.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
