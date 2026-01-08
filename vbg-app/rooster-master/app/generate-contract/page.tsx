'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { FileText, ArrowLeft, User, Building, Calendar, DollarSign, Download, Send, PenTool, Check, X } from 'lucide-react';

export default function GenerateContract() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const userTypeParam = searchParams.get('userType');
  const templateId = searchParams.get('template');
  
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || '');
  const [userTypeFilter, setUserTypeFilter] = useState(userTypeParam || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractId, setContractId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contractData, setContractData] = useState({
    contractorName: '',
    contractorEmail: '',
    clientAddress: '',
    projectName: 'Construction Project',
    projectDescription: 'General construction and renovation work',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: '50000',
    paymentTerms: 'Net 30 days',
    scope: 'Complete construction work as specified in project documents'
  });



  // Fetch users once when component mounts
  useEffect(() => {
    if (loading) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        // Fetch users and templates in parallel
        const [usersResponse, templatesResponse] = await Promise.all([
          fetch(`${API_URL}/api/admin/users`, { credentials: 'include' }),
          fetch(`${API_URL}/api/admin/contract-templates`, { credentials: 'include' })
        ]);
        
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsers(userData);
          
          // If userId is provided in URL params, select that user
          if (selectedUserId) {
            const selectedUser = userData.find((u: any) => u.id.toString() === selectedUserId);
            if (selectedUser) {
              setContractData(prev => ({
                ...prev,
                contractorName: selectedUser.name,
                contractorEmail: selectedUser.email,
                clientAddress: selectedUser.address || ''
              }));
            }
          }
        } else {
          console.error('Failed to fetch users');
        }
        
        if (templatesResponse.ok) {
          const templateResponse = await templatesResponse.json();
          console.log('Templates API response:', templateResponse);
          
          // Handle both direct array and wrapped object responses
          const templateData = templateResponse.templates || templateResponse;
          console.log('Parsed template data:', templateData);
          console.log('Is templateData an array?', Array.isArray(templateData));
          
          // Ensure templateData is an array
          if (Array.isArray(templateData)) {
            // If no templates exist, create a default fallback
            if (templateData.length === 0) {
              const defaultTemplate = {
                id: 'default',
                name: 'Default Construction Contract',
                type: 'construction',
                description: 'Standard construction contract template',
                content: 'CONSTRUCTION CONTRACT\n\nThis Construction Contract is entered into on {{DATE}} between:\n\nCONTRACTOR: {{CONTRACTOR_NAME}}\nEmail: {{CONTRACTOR_EMAIL}}\n\nCLIENT: {{CLIENT_NAME}}\nEmail: {{CLIENT_EMAIL}}\n\nPROJECT DETAILS:\nProject Name: {{PROJECT_NAME}}\nDescription: {{PROJECT_DESCRIPTION}}\nStart Date: {{START_DATE}}\nCompletion Date: {{END_DATE}}\nTotal Contract Amount: ${{TOTAL_AMOUNT}}\nPayment Terms: {{PAYMENT_TERMS}}\n\nSCOPE OF WORK:\n{{SCOPE_OF_WORK}}\n\nTERMS AND CONDITIONS:\n1. The Contractor agrees to provide all labor, materials, and services necessary for the completion of the project.\n2. Payment shall be made according to the payment terms specified above.\n3. Any changes to the scope of work must be agreed upon in writing by both parties.\n4. The Contractor shall maintain appropriate insurance coverage throughout the project.\n5. This contract shall be governed by the laws of the applicable jurisdiction.\n\nThis contract will be executed through digital signature upon client approval.'
              };
              setTemplates([defaultTemplate]);
              setSelectedTemplateId('default');
            } else {
              setTemplates(templateData);
              console.log('Templates loaded:', templateData.length);
              
              // If no template is pre-selected, select the first one
              if (!selectedTemplateId && templateData.length > 0) {
                setSelectedTemplateId(templateData[0].id);
              }
            }
          } else {
            console.error('Templates data is not an array:', templateData);
            console.error('Type of templateData:', typeof templateData);
            console.error('templateData constructor:', templateData?.constructor?.name);
            console.error('Object.prototype.toString.call(templateData):', Object.prototype.toString.call(templateData));
            setTemplates([]);
          }
        } else {
          console.error('Failed to fetch templates:', templatesResponse.status, templatesResponse.statusText);
          setTemplates([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Ensure templates is always an array
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [loading, selectedUserId, selectedTemplateId]);

  // Handle user selection from dropdown
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    
    if (!userId) {
      // Reset contract data if no user selected
      setContractData(prev => ({
        ...prev,
        contractorName: '',
        contractorEmail: '',
        clientAddress: ''
      }));
      return;
    }
    
    // Find selected user from already loaded users array
    const selectedUser = users.find((u: any) => u.id.toString() === userId);
    if (selectedUser) {
      setContractData(prev => ({
        ...prev,
        contractorName: selectedUser.name,
        contractorEmail: selectedUser.email,
        clientAddress: selectedUser.address || ''
      }));
    }
  };

  // Show signature step first
  const showSignatureModal = () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }
    
    if (!selectedTemplateId) {
      alert('Please select a contract template first');
      return;
    }
    
    setShowSignatureStep(true);
  };

  // Generate contract function (called after signing)
  const generateContract = async () => {
    setIsGenerating(true);
    
    try {
      // Get the selected template
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        alert('Selected template not found');
        setIsGenerating(false);
        return;
      }
      
      // Generate contract content from template with placeholder replacement
      let contractContent = selectedTemplate.content || selectedTemplate.template_content;
      
      // Replace placeholders with actual data
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const placeholders = {
        // Date variations (both formats)
        '{{DATE}}': currentDate,
        '[CONTRACT_DATE]': currentDate,
        '{{CURRENT_DATE}}': currentDate,
        '{{TODAY}}': currentDate,
        
        // Contract ID
        '[CONTRACT_ID]': `CONTRACT_${Date.now()}`,
        '{{CONTRACT_ID}}': `CONTRACT_${Date.now()}`,
        
        // Contractor/Company info
        '{{CONTRACTOR_NAME}}': 'Rooster Construction LLC',
        '{{COMPANY_NAME}}': 'Rooster Construction LLC',
        '{{CONTRACTOR_EMAIL}}': 'niko@roosterconstruction.org',
        '{{COMPANY_EMAIL}}': 'niko@roosterconstruction.org',
        
        // Client info (both formats)
        '{{CLIENT_NAME}}': contractData.contractorName || 'Client Name',
        '[CLIENT_NAME]': contractData.contractorName || 'Client Name',
        '{{CLIENT_EMAIL}}': contractData.contractorEmail || 'client@email.com',
        '[CLIENT_EMAIL]': contractData.contractorEmail || 'client@email.com',
        '{{CUSTOMER_NAME}}': contractData.contractorName || 'Client Name',
        '{{CUSTOMER_EMAIL}}': contractData.contractorEmail || 'client@email.com',
        '[CLIENT_ADDRESS]': 'Client Address', // Default since we don't collect address
        
        // Project details (both formats)
        '{{PROJECT_NAME}}': contractData.projectName || 'Construction Project',
        '[PROJECT_NAME]': contractData.projectName || 'Construction Project',
        '{{PROJECT_DESCRIPTION}}': contractData.projectDescription || 'General construction work',
        '[PROJECT_DESCRIPTION]': contractData.projectDescription || 'General construction work',
        '{{PROJECT_DETAILS}}': contractData.projectDescription || 'General construction work',
        '[PROJECT_LOCATION]': contractData.projectName || 'Project Location', // Use project name as location
        
        // Dates (both formats)
        '{{START_DATE}}': new Date(contractData.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        '[START_DATE]': new Date(contractData.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        '{{END_DATE}}': new Date(contractData.endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        '[END_DATE]': new Date(contractData.endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        
        // Financial (both formats)
        '{{TOTAL_AMOUNT}}': `$${parseFloat(contractData.totalAmount || '0').toLocaleString()}`,
        '[TOTAL_AMOUNT]': parseFloat(contractData.totalAmount || '0').toLocaleString(), // Without $ for square brackets
        '{{AMOUNT}}': `$${parseFloat(contractData.totalAmount || '0').toLocaleString()}`,
        '{{CONTRACT_AMOUNT}}': `$${parseFloat(contractData.totalAmount || '0').toLocaleString()}`,
        '{{PAYMENT_TERMS}}': contractData.paymentTerms || 'Net 30 days',
        '[PAYMENT_TERMS]': contractData.paymentTerms || 'Net 30 days',
        
        // Scope (both formats)
        '{{SCOPE_OF_WORK}}': contractData.scope || 'General construction work',
        '[SCOPE_OF_WORK]': contractData.scope || 'General construction work',
        '{{SCOPE}}': contractData.scope || 'General construction work',
        '{{WORK_DESCRIPTION}}': contractData.scope || 'General construction work'
      };
      
      // Replace all placeholders (handle both {{ }} and [ ] formats)
      Object.entries(placeholders).forEach(([placeholder, value]) => {
        // Escape special regex characters in the placeholder
        const escapedPlaceholder = placeholder.replace(/[{}\[\]]/g, '\\$&');
        contractContent = contractContent.replace(new RegExp(escapedPlaceholder, 'g'), value);
      });
      
      // Log for debugging
      const remainingCurlyPlaceholders = (contractContent.match(/\{\{[^}]*\}\}/g) || []).length;
      const remainingSquarePlaceholders = (contractContent.match(/\[[^\]]*\]/g) || []).length;
      console.log('DEBUG: Placeholder replacement completed.');
      console.log('Remaining curly placeholders:', remainingCurlyPlaceholders);
      console.log('Remaining square placeholders:', remainingSquarePlaceholders);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          contractData,
          contractContent
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setContractId(data.contractId);
        setShowSuccess(true);
      } else {
        alert(`Error: ${data.error || 'Failed to generate contract'}`);
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('An error occurred while generating the contract');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize canvas when signature modal opens
  useEffect(() => {
    if (showSignatureStep && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showSignatureStep]);

  // Get coordinates from either mouse or touch event
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e && e.touches.length > 0) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      // Touch end event
      const touch = e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else if ('clientX' in e) {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    
    return { x: 0, y: 0 };
  };

  // Signature canvas functions - now support both mouse and touch
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAdminSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    setAdminSignature(signatureData);
  };

  const signAndGenerateContract = async () => {
    if (!adminSignature) {
      alert('Please provide your signature first');
      return;
    }
    
    setShowSignatureStep(false);
    setIsGenerating(true);
    
    try {
      // Generate the contract first
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        alert('Selected template not found');
        setIsGenerating(false);
        return;
      }
      
      // Generate contract content from template with placeholder replacement
      let contractContent = selectedTemplate.content || selectedTemplate.template_content;
      
      // Replace placeholders with actual data
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const contractId = `CONTRACT_${Date.now()}`;
      const formattedAmount = `$${parseFloat(contractData.totalAmount).toLocaleString()}`;
      const startDate = new Date(contractData.startDate).toLocaleDateString();
      const endDate = new Date(contractData.endDate).toLocaleDateString();
      
      const placeholders = {
        // Date variations (both formats)
        '{{DATE}}': currentDate,
        '[CONTRACT_DATE]': currentDate,
        '{{CURRENT_DATE}}': currentDate,
        '{{TODAY}}': currentDate,
        
        // Contract ID
        '[CONTRACT_ID]': contractId,
        '{{CONTRACT_ID}}': contractId,
        
        // Contractor/Client information
        '[CONTRACTOR_NAME]': contractData.contractorName,
        '{{CONTRACTOR_NAME}}': contractData.contractorName,
        '[CLIENT_NAME]': contractData.contractorName,
        '{{CLIENT_NAME}}': contractData.contractorName,
        '[CUSTOMER_NAME]': contractData.contractorName,
        '{{CUSTOMER_NAME}}': contractData.contractorName,
        '[OWNER_NAME]': contractData.contractorName,
        '{{OWNER_NAME}}': contractData.contractorName,
        
        // Project details
        '[PROJECT_NAME]': contractData.projectName,
        '{{PROJECT_NAME}}': contractData.projectName,
        '[PROJECT_DESCRIPTION]': contractData.projectDescription,
        '{{PROJECT_DESCRIPTION}}': contractData.projectDescription,
        '[PROJECT_LOCATION]': 'TBD', // Add default location
        '{{PROJECT_LOCATION}}': 'TBD',
        '[SCOPE]': contractData.scope,
        '{{SCOPE}}': contractData.scope,
        '[SCOPE_OF_WORK]': contractData.scope,
        '{{SCOPE_OF_WORK}}': contractData.scope,
        
        // Dates
        '[START_DATE]': startDate,
        '{{START_DATE}}': startDate,
        '[END_DATE]': endDate,
        '{{END_DATE}}': endDate,
        '[EFFECTIVE_DATE]': currentDate,
        '{{EFFECTIVE_DATE}}': currentDate,
        
        // Financial
        '[TOTAL_AMOUNT]': formattedAmount,
        '{{TOTAL_AMOUNT}}': formattedAmount,
        '[PAYMENT_TERMS]': contractData.paymentTerms,
        '{{PAYMENT_TERMS}}': contractData.paymentTerms,
        
        // Address placeholders
        '[CLIENT_ADDRESS]': contractData.clientAddress || 'TBD',
        '{{CLIENT_ADDRESS}}': contractData.clientAddress || 'TBD',
        '[OWNER_ADDRESS]': contractData.clientAddress || 'TBD',
        '{{OWNER_ADDRESS}}': contractData.clientAddress || 'TBD',
        
        // Contract number variations
        '[CONTRACT_NUMBER]': contractId,
        '{{CONTRACT_NUMBER}}': contractId
      };
      
      // Replace all placeholders in a single pass to avoid recursive replacements
      let processedContent = contractContent;
      Object.entries(placeholders).forEach(([placeholder, value]) => {
        // Use a more specific replacement to avoid recursive issues
        processedContent = processedContent.split(placeholder).join(value);
      });
      contractContent = processedContent;
      
      // Create contract with admin signature
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          contractData,
          contractContent,
          adminSignature // Include admin signature in contract creation
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const newContractId = data.contractId;
        setContractId(newContractId);
        
        // Now sign the contract with admin signature
        const signResponse = await fetch(`${API_URL}/api/admin/contracts/${newContractId}/sign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ signature: adminSignature })
        });
        
        if (signResponse.ok) {
          console.log('Admin signature added successfully');
        } else {
          console.error('Failed to add admin signature');
        }
        
        setShowSuccess(true);
      } else {
        alert(`Error: ${data.error || 'Failed to generate contract'}`);
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('An error occurred while generating the contract');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          Generate {userTypeFilter === 'client' ? 'Client' : userTypeFilter === 'subcontractor' ? 'Subcontractor' : ''} Contract
        </h1>
      </div>
      
      {isLoading && !showSuccess ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading contract generation page...</p>
          </div>
        </div>
      ) : showSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-800">Contract Generated Successfully!</h2>
          </div>
          <p className="mb-4 text-gray-700">Contract ID: <span className="font-mono font-bold">{contractId}</span></p>
          <p className="mb-6 text-gray-700">The contract has been saved to the database and an email notification has been sent to {contractData.contractorName}.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowSuccess(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Generate Another Contract
            </button>
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Filter by user type:</label>
              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={() => setUserTypeFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${userTypeFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  All
                </button>
                <button 
                  type="button"
                  onClick={() => setUserTypeFilter('client')}
                  className={`px-3 py-1 text-sm rounded ${userTypeFilter === 'client' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Clients
                </button>
                <button 
                  type="button"
                  onClick={() => setUserTypeFilter('subcontractor')}
                  className={`px-3 py-1 text-sm rounded ${userTypeFilter === 'subcontractor' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Subcontractors
                </button>
              </div>
            </div>
            <label className="block text-sm font-medium mb-2">Select User:</label>
            <select 
              className="w-full p-2 border rounded" 
              value={selectedUserId} 
              onChange={(e) => handleUserSelect(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">Select a user</option>
              {users
                .filter((user: any) => {
                  if (userTypeFilter === 'all') return true;
                  if (userTypeFilter === 'client') return user.user_type === 'client';
                  if (userTypeFilter === 'subcontractor') return user.user_type === 'subcontractor' || !user.user_type;
                  return true;
                })
                .map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) {user.user_type ? `- ${user.user_type}` : ''}
                  </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contract Template:</label>
            <select 
              className="w-full p-2 border rounded" 
              value={selectedTemplateId} 
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">Select a template</option>
              {templates && Array.isArray(templates) ? templates.map((template: any) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.type || template.category || 'general'}
                </option>
              )) : (
                <option value="" disabled>Loading templates...</option>
              )}
            </select>
            {selectedTemplateId && templates && Array.isArray(templates) && (
              <p className="text-sm text-gray-600 mt-1">
                {templates.find(t => t.id === selectedTemplateId)?.description || 'No description available'}
              </p>
            )}
          </div>

          {/* Client Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Client Address:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded"
              placeholder="Enter client's full address"
              value={contractData.clientAddress}
              onChange={(e) => setContractData({...contractData, clientAddress: e.target.value})}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={contractData.projectName}
                onChange={(e) => setContractData({...contractData, projectName: e.target.value})}
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Total Amount ($):</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={contractData.totalAmount}
                onChange={(e) => setContractData({...contractData, totalAmount: e.target.value})}
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Start Date:</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded"
                value={contractData.startDate}
                onChange={(e) => setContractData({...contractData, startDate: e.target.value})}
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date:</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded"
                value={contractData.endDate}
                onChange={(e) => setContractData({...contractData, endDate: e.target.value})}
                disabled={isGenerating}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Project Description:</label>
            <textarea 
              className="w-full p-2 border rounded h-32"
              value={contractData.projectDescription}
              onChange={(e) => setContractData({...contractData, projectDescription: e.target.value})}
              disabled={isGenerating}
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Payment Terms:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded"
              value={contractData.paymentTerms}
              onChange={(e) => setContractData({...contractData, paymentTerms: e.target.value})}
              disabled={isGenerating}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Scope of Work:</label>
            <textarea 
              className="w-full p-2 border rounded h-32"
              value={contractData.scope}
              onChange={(e) => setContractData({...contractData, scope: e.target.value})}
              disabled={isGenerating}
            ></textarea>
          </div>

          <div className="flex justify-between mt-8">
            <Link href="/dashboard" className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
            
            <button 
              onClick={showSignatureModal} 
              disabled={isGenerating || !selectedUserId}
              className={`px-6 py-2 rounded-md text-white flex items-center ${isGenerating || !selectedUserId ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 mr-2" /> Sign & Send Contract
                </>
              )}
            </button>
          </div>
        </>
      )}
      
      {/* Admin Signature Modal */}
      {showSignatureStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Admin Signature Required
              </h2>
              <button 
                onClick={() => setShowSignatureStep(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please provide your digital signature before generating and sending the contract.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border-2 border-blue-300 rounded cursor-crosshair w-full bg-white"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
                // Mouse events
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                // Touch events
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                // Pointer events (modern approach)
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
              />
              <p className="text-sm text-gray-600 mt-2 text-center font-medium">
                👆 Draw your signature above (use finger on mobile)
              </p>
            </div>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </button>
              
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Signature
              </button>
            </div>
            
            {adminSignature && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Signature saved successfully!
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSignatureStep(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              
              <button
                onClick={signAndGenerateContract}
                disabled={!adminSignature || isGenerating}
                className={`px-6 py-2 rounded-md text-white flex items-center ${
                  !adminSignature || isGenerating 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Sign & Generate Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
