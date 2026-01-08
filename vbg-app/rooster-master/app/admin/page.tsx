'use client';

import Link from 'next/link';
import { Shield, UserPlus, LogIn, ArrowRight, Building, Users, FileText, Settings } from 'lucide-react';

export default function AdminLandingPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600">
                  ROOSTER
                </span>
                <span className="text-gray-700 ml-2">Admin</span>
              </span>
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              ← Back to Main Site
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-8">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your Rooster Construction Management system with powerful admin tools and comprehensive oversight.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600">Manage users, permissions, and access controls</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Document Oversight</h3>
            <p className="text-sm text-gray-600">Review and approve user documents</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Job Management</h3>
            <p className="text-sm text-gray-600">Create and assign construction jobs</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">System Control</h3>
            <p className="text-sm text-gray-600">Configure system settings and preferences</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h2>
              <p className="text-gray-600">
                Already have an admin account? Sign in to access your dashboard.
              </p>
            </div>
            
            <Link
              href="/admin/login"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 group"
            >
              Sign In to Admin Panel
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Use your admin credentials to access the dashboard
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Admin Account</h2>
              <p className="text-gray-600">
                New admin? Register with your admin key to get started.
              </p>
            </div>
            
            <Link
              href="/admin/register"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 group"
            >
              Register as Admin
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Admin registration key required
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Security Notice</h3>
              <p className="text-sm text-yellow-700">
                Admin access is restricted and monitored. Only authorized personnel should access this portal. 
                All admin activities are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
