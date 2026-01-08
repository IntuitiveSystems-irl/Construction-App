'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Upload,
  Eye,
  Trash2,
  Download,
  ArrowLeft,
  Calendar,
  User,
  Edit,
  Copy,
  Search
} from 'lucide-react';

interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  file_path?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  template_content: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export default function ContractTemplates() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('general');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  const categories = [
    { value: 'general', label: 'General Contract' },
    { value: 'construction', label: 'Construction' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'supply', label: 'Supply Agreement' },
    { value: 'service', label: 'Service Agreement' }
  ];

  const fetchTemplates = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/contract-templates`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAdmin = user?.isAdmin || (user as any)?.is_admin || user?.id === 15;
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchTemplates();
  }, [user, router, fetchTemplates]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!templateContent.trim()) {
      alert('Please enter template content');
      return;
    }

    setIsCreating(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${API_URL}/api/admin/contract-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName,
          category: templateCategory,
          description: templateDescription,
          content: templateContent
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Template created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTemplates();
      } else {
        alert(`Error: ${data.error || 'Failed to create template'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('An error occurred while creating the template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/contract-templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Template deleted successfully');
        fetchTemplates();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to delete template'}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('An error occurred while deleting the template');
    }
  };

  const handleViewTemplate = (template: ContractTemplate) => {
    if (template.file_path) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const fileUrl = `${API_URL}/api/contract-templates/${template.id}/file`;
      window.open(fileUrl, '_blank');
    } else {
      // Show text content in modal or new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Template: ${template.name}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; white-space: pre-wrap;">
              <h1>${template.name}</h1>
              <hr>
              ${template.template_content}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateCategory('general');
    setTemplateDescription('');
    setTemplateContent('');
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard?tab=admin"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first contract template to get started.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center mx-auto px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{template.name}</h3>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                    {template.file_path && (
                      <div className="ml-2" title="Has file">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  )}

                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <User className="h-3 w-3 mr-1" />
                    <span className="mr-3">{template.created_by_name}</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>

                  {template.file_path && (
                    <div className="text-xs text-gray-500 mb-4">
                      <span className="font-medium">File:</span> {template.original_filename}
                      {template.file_size && (
                        <span className="ml-2">({(template.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewTemplate(template)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <Link
                        href={`/generate-contract?template=${template.id}`}
                        className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Use
                      </Link>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create Contract Template</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-6">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Standard Construction Contract"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Brief description of this template..."
                  />
                </div>





                {/* Info about placeholders */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Available Placeholders:</h4>
                  <div className="text-xs text-blue-800 grid grid-cols-3 gap-1">
                    <span>[CONTRACT_NUMBER]</span>
                    <span>[EFFECTIVE_DATE]</span>
                    <span>[CURRENT_DATE]</span>
                    <span>[OWNER_NAME]</span>
                    <span>[OWNER_ADDRESS]</span>
                    <span>[CONTRACTOR_NAME]</span>
                    <span>[CONTRACTOR_ADDRESS]</span>
                    <span>[BUSINESS_NAME]</span>
                    <span>[PROJECT_NAME]</span>
                    <span>[PROJECT_DESCRIPTION]</span>
                    <span>[WORKSITE_ADDRESS]</span>
                    <span>[SERVICES_DESCRIPTION]</span>
                    <span>[START_DATE]</span>
                    <span>[COMPLETION_DATE]</span>
                    <span>[TOTAL_AMOUNT]</span>
                    <span>[CONTRACT_PRICE]</span>
                    <span>[PAYMENT_TERMS]</span>
                    <span>[SCOPE_OF_WORK]</span>
                    <span>[CLIENT_NAME]</span>
                    <span>[CLIENT_EMAIL]</span>
                    <span>[CONTRACTOR_EMAIL]</span>
                    <span>[CONTRACTOR_LICENSE]</span>
                  </div>
                </div>

                {/* Template Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Content *
                  </label>
                  <textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={12}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter your contract template here. Use the placeholders above to insert dynamic content.&#10;&#10;Example:&#10;[BUSINESS_NAME] Contract&#10;Contract #: [CONTRACT_NUMBER]&#10;&#10;This Construction Contract is made as of [EFFECTIVE_DATE] by and between [OWNER_NAME] of [OWNER_ADDRESS] and [BUSINESS_NAME] of [CONTRACTOR_ADDRESS].&#10;&#10;1. Description of Services: [SERVICES_DESCRIPTION]&#10;2. Scope of Work: [SCOPE_OF_WORK] at [WORKSITE_ADDRESS]&#10;3. Payment: Total Amount: $[CONTRACT_PRICE]&#10;   Payment Terms: [PAYMENT_TERMS]&#10;4. Timeline: Start Date: [START_DATE], Completion: [COMPLETION_DATE]&#10;&#10;Final Price: $[TOTAL_AMOUNT]&#10;&#10;Owner: [OWNER_NAME]&#10;Date: [CURRENT_DATE]&#10;&#10;Contractor: [CONTRACTOR_NAME]&#10;License: [CONTRACTOR_LICENSE]"
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
