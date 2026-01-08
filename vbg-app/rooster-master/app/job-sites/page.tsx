'use client'

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Clock, User, DollarSign, FileText, ArrowLeft, Phone, Mail, Building } from 'lucide-react';

interface JobSite {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  role: string;
  assigned_date: string;
  client_name: string;
  project_manager: string;
  notes: string;
  safety_requirements: string;
}

export default function JobSitesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedJobSite, setSelectedJobSite] = useState<JobSite | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchJobSites();
    }
  }, [user, loading, router]);

  const fetchJobSites = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/user/job-sites`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setJobSites(data);
        
        // Mark job site notifications as viewed
        await fetch(`${API_URL}/api/user/job-sites/mark-viewed`, {
          method: 'PUT',
          credentials: 'include'
        });
      } else {
        console.error('Failed to fetch job sites');
      }
    } catch (error) {
      console.error('Error fetching job sites:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isClient = (user as any)?.user_type === 'client';

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">My Job Sites</h1>
                <p className="text-orange-100 mt-2">
                  {isClient ? 'Your project locations and details' : 'Your assigned work locations'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8" />
              <span className="text-2xl font-bold">{jobSites.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobSites.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Sites Assigned</h3>
            <p className="text-gray-600">
              {isClient 
                ? "You don't have any active projects yet. Contact your project manager to get started."
                : "You haven't been assigned to any job sites yet. Check back later for new assignments."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobSites.map((jobSite) => (
              <div
                key={jobSite.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedJobSite(jobSite)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{jobSite.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(jobSite.status)}`}>
                        {jobSite.status.charAt(0).toUpperCase() + jobSite.status.slice(1)}
                      </span>
                    </div>
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{jobSite.address}, {jobSite.city}, {jobSite.state}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Role: {jobSite.role || 'Team Member'}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDate(jobSite.start_date)} - {formatDate(jobSite.end_date)}</span>
                    </div>

                    {isClient && jobSite.budget && parseFloat(jobSite.budget.toString()) > 0 && (
                      <div className="flex items-center text-sm text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>Budget: ${parseFloat(jobSite.budget.toString()).toLocaleString()}</span>
                      </div>
                    )}

                    {jobSite.client_name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Client: {jobSite.client_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {jobSite.description || 'No description available'}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Assigned: {formatDate(jobSite.assigned_date)}
                    </span>
                    <Link 
                      href={`/job-sites/${jobSite.id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Site Detail Modal */}
      {selectedJobSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJobSite.name}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-2 ${getStatusColor(selectedJobSite.status)}`}>
                    {selectedJobSite.status.charAt(0).toUpperCase() + selectedJobSite.status.slice(1)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJobSite(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Location & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{selectedJobSite.address}</span>
                    </div>
                    <div className="text-gray-600 ml-6">
                      {selectedJobSite.city}, {selectedJobSite.state} {selectedJobSite.zip_code}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Start: {formatDate(selectedJobSite.start_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>End: {formatDate(selectedJobSite.end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Role: {selectedJobSite.role || 'Team Member'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Assigned: {formatDate(selectedJobSite.assigned_date)}</span>
                  </div>
                  {selectedJobSite.client_name && (
                    <div className="flex items-center text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span>Client: {selectedJobSite.client_name}</span>
                    </div>
                  )}
                  {isClient && selectedJobSite.budget && parseFloat(selectedJobSite.budget.toString()) > 0 && (
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Budget: ${parseFloat(selectedJobSite.budget.toString()).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedJobSite.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedJobSite.description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedJobSite.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {isClient ? 'Project Notes' : 'Work Instructions'}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJobSite.notes}</p>
                  </div>
                </div>
              )}

              {/* Safety Requirements */}
              {selectedJobSite.safety_requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Requirements</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 whitespace-pre-wrap">{selectedJobSite.safety_requirements}</p>
                  </div>
                </div>
              )}

              {/* Project Manager */}
              {selectedJobSite.project_manager && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Manager</h3>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>{selectedJobSite.project_manager}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedJobSite(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
