'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Mail, Send, PenTool, Check, X } from 'lucide-react';

export default function SendContractToGuest() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractId, setContractId] = useState('');
  const [signingUrl, setSigningUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [contractData, setContractData] = useState({
    guestName: '',
    guestEmail: '',
    clientAddress: '',
    projectName: 'Construction Project',
    projectDescription: 'General construction and renovation work',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: '50000',
    paymentTerms: 'Net 30 days',
    scope: 'Complete construction work as specified in project documents'
  });

  useEffect(() => {
    if (loading) return;
    
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
        const response = await fetch(`${API_URL}/api/admin/contract-templates`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const templateData = data.templates || data;
          
          if (Array.isArray(templateData) && templateData.length > 0) {
            setTemplates(templateData);
            setSelectedTemplateId(templateData[0].id);
          } else {
            const defaultTemplate = {
              id: 'default',
              name: 'Default Construction Contract',
              category: 'construction',
              content: 'CONSTRUCTION CONTRACT\n\nThis Construction Contract is entered into on {{DATE}} between:\n\nCONTRACTOR: Veritas Building Group\nCLIENT: {{CLIENT_NAME}}\nEmail: {{CLIENT_EMAIL}}\n\nPROJECT: {{PROJECT_NAME}}\nAmount: ${{TOTAL_AMOUNT}}\nStart: {{START_DATE}}\nEnd: {{END_DATE}}\n\nSCOPE: {{SCOPE_OF_WORK}}\n\nPayment Terms: {{PAYMENT_TERMS}}'
            };
            setTemplates([defaultTemplate]);
            setSelectedTemplateId('default');
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [loading]);

  const showSignatureModal = () => {
    if (!contractData.guestName || !contractData.guestEmail) {
      alert('Please enter recipient name and email');
      return;
    }
    if (!selectedTemplateId) {
      alert('Please select a contract template');
      return;
    }
    setShowSignatureStep(true);
  };

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

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else if ('clientX' in e) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

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
    setAdminSignature(canvas.toDataURL('image/png'));
  };

  const signAndSendContract = async () => {
    if (!adminSignature) {
      alert('Please provide your signature first');
      return;
    }
    
    setShowSignatureStep(false);
    setIsGenerating(true);
    
    try {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        alert('Selected template not found');
        setIsGenerating(false);
        return;
      }
      
      let contractContent = selectedTemplate.content || selectedTemplate.template_content;
      
      const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const generatedContractId = `CONTRACT_${Date.now()}`;
      const formattedAmount = `$${parseFloat(contractData.totalAmount).toLocaleString()}`;
      const startDate = new Date(contractData.startDate).toLocaleDateString();
      const endDate = new Date(contractData.endDate).toLocaleDateString();
      
      const placeholders: Record<string, string> = {
        // Dates
        '{{DATE}}': currentDate, '[DATE]': currentDate,
        '[CONTRACT_DATE]': currentDate, '{{CONTRACT_DATE}}': currentDate,
        '{{CURRENT_DATE}}': currentDate, '[CURRENT_DATE]': currentDate,
        '[EFFECTIVE_DATE]': currentDate, '{{EFFECTIVE_DATE}}': currentDate,
        '[START_DATE]': startDate, '{{START_DATE}}': startDate,
        '[END_DATE]': endDate, '{{END_DATE}}': endDate,
        
        // Contract ID/Number
        '[CONTRACT_ID]': generatedContractId, '{{CONTRACT_ID}}': generatedContractId,
        '[CONTRACT_NUMBER]': generatedContractId, '{{CONTRACT_NUMBER}}': generatedContractId,
        
        // Company info
        '{{CONTRACTOR_NAME}}': 'Veritas Building Group', '[CONTRACTOR_NAME]': 'Veritas Building Group',
        '{{COMPANY_NAME}}': 'Veritas Building Group', '[COMPANY_NAME]': 'Veritas Building Group',
        '{{CONTRACTOR_EMAIL}}': 'info@veribuilds.com', '[CONTRACTOR_EMAIL]': 'info@veribuilds.com',
        '{{COMPANY_EMAIL}}': 'info@veribuilds.com', '[COMPANY_EMAIL]': 'info@veribuilds.com',
        
        // Client/Owner info
        '[CLIENT_NAME]': contractData.guestName, '{{CLIENT_NAME}}': contractData.guestName,
        '[OWNER_NAME]': contractData.guestName, '{{OWNER_NAME}}': contractData.guestName,
        '[CUSTOMER_NAME]': contractData.guestName, '{{CUSTOMER_NAME}}': contractData.guestName,
        '[CLIENT_EMAIL]': contractData.guestEmail, '{{CLIENT_EMAIL}}': contractData.guestEmail,
        '[OWNER_EMAIL]': contractData.guestEmail, '{{OWNER_EMAIL}}': contractData.guestEmail,
        '[CLIENT_ADDRESS]': contractData.clientAddress || '[Address]', '{{CLIENT_ADDRESS}}': contractData.clientAddress || '[Address]',
        '[OWNER_ADDRESS]': contractData.clientAddress || '[Address]', '{{OWNER_ADDRESS}}': contractData.clientAddress || '[Address]',
        
        // Project details
        '[PROJECT_NAME]': contractData.projectName, '{{PROJECT_NAME}}': contractData.projectName,
        '[PROJECT_DESCRIPTION]': contractData.projectDescription, '{{PROJECT_DESCRIPTION}}': contractData.projectDescription,
        '[PROJECT_DETAILS]': contractData.projectDescription, '{{PROJECT_DETAILS}}': contractData.projectDescription,
        '[PROJECT_LOCATION]': contractData.projectName, '{{PROJECT_LOCATION}}': contractData.projectName,
        
        // Scope
        '[SCOPE_OF_WORK]': contractData.scope, '{{SCOPE_OF_WORK}}': contractData.scope,
        '[SCOPE]': contractData.scope, '{{SCOPE}}': contractData.scope,
        '[WORK_DESCRIPTION]': contractData.scope, '{{WORK_DESCRIPTION}}': contractData.scope,
        
        // Financial
        '[TOTAL_AMOUNT]': formattedAmount, '{{TOTAL_AMOUNT}}': formattedAmount,
        '[AMOUNT]': formattedAmount, '{{AMOUNT}}': formattedAmount,
        '[CONTRACT_AMOUNT]': formattedAmount, '{{CONTRACT_AMOUNT}}': formattedAmount,
        '[PAYMENT_TERMS]': contractData.paymentTerms, '{{PAYMENT_TERMS}}': contractData.paymentTerms,
      };
      
      Object.entries(placeholders).forEach(([placeholder, value]) => {
        contractContent = contractContent.split(placeholder).join(value);
      });
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/admin/contracts/create-and-send-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          guestName: contractData.guestName,
          guestEmail: contractData.guestEmail,
          projectName: contractData.projectName,
          projectDescription: contractData.projectDescription,
          totalAmount: contractData.totalAmount,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
          paymentTerms: contractData.paymentTerms,
          scope: contractData.scope,
          contractContent,
          adminSignature
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setContractId(data.contractId);
        setSigningUrl(data.signingUrl);
        setShowSuccess(true);
      } else {
        alert(`Error: ${data.error || 'Failed to send contract'}`);
      }
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('An error occurred while sending the contract');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">Send Contract to Guest</h1>
        </div>
        <Link href="/admin/contract-templates" className="flex items-center px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200">
          <FileText className="h-4 w-4 mr-2" />Manage Templates
        </Link>
      </div>
      
      {isLoading && !showSuccess ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : showSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-2 mr-3"><Mail className="h-6 w-6 text-green-600" /></div>
            <h2 className="text-xl font-semibold text-green-800">Contract Sent Successfully!</h2>
          </div>
          <p className="mb-4 text-gray-700">Contract ID: <span className="font-mono font-bold">{contractId}</span></p>
          <p className="mb-4 text-gray-700">A signing link has been sent to <strong>{contractData.guestEmail}</strong></p>
          {signingUrl && <p className="mb-6 text-gray-700 text-sm">Signing URL: <a href={signingUrl} className="text-cyan-600 break-all">{signingUrl}</a></p>}
          <div className="flex space-x-4">
            <button onClick={() => { setShowSuccess(false); setContractData({ guestName: '', guestEmail: '', clientAddress: '', projectName: 'Construction Project', projectDescription: 'General construction and renovation work', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalAmount: '50000', paymentTerms: 'Net 30 days', scope: 'Complete construction work as specified in project documents' }); }} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Send Another Contract</button>
            <Link href="/dashboard" className="px-4 py-2 bg-cyan-600 rounded-md text-white hover:bg-cyan-700">Return to Dashboard</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center"><Mail className="h-5 w-5 mr-2" />Recipient Information (Guest - No Account Required)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Name *</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="John Doe" value={contractData.guestName} onChange={(e) => setContractData({...contractData, guestName: e.target.value})} disabled={isGenerating} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Email *</label>
                <input type="email" className="w-full p-2 border rounded" placeholder="john@example.com" value={contractData.guestEmail} onChange={(e) => setContractData({...contractData, guestEmail: e.target.value})} disabled={isGenerating} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contract Template:</label>
            <select className="w-full p-2 border rounded" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} disabled={isGenerating}>
              <option value="">Select a template</option>
              {templates.map((template: any) => (<option key={template.id} value={template.id}>{template.name} - {template.category || 'general'}</option>))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Client Address:</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="Enter client's full address" value={contractData.clientAddress} onChange={(e) => setContractData({...contractData, clientAddress: e.target.value})} disabled={isGenerating} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name:</label>
              <input type="text" className="w-full p-2 border rounded" value={contractData.projectName} onChange={(e) => setContractData({...contractData, projectName: e.target.value})} disabled={isGenerating} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Amount ($):</label>
              <input type="text" className="w-full p-2 border rounded" value={contractData.totalAmount} onChange={(e) => setContractData({...contractData, totalAmount: e.target.value})} disabled={isGenerating} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date:</label>
              <input type="date" className="w-full p-2 border rounded" value={contractData.startDate} onChange={(e) => setContractData({...contractData, startDate: e.target.value})} disabled={isGenerating} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date:</label>
              <input type="date" className="w-full p-2 border rounded" value={contractData.endDate} onChange={(e) => setContractData({...contractData, endDate: e.target.value})} disabled={isGenerating} />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Project Description:</label>
            <textarea className="w-full p-2 border rounded h-32" value={contractData.projectDescription} onChange={(e) => setContractData({...contractData, projectDescription: e.target.value})} disabled={isGenerating}></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Payment Terms:</label>
            <input type="text" className="w-full p-2 border rounded" value={contractData.paymentTerms} onChange={(e) => setContractData({...contractData, paymentTerms: e.target.value})} disabled={isGenerating} />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Scope of Work:</label>
            <textarea className="w-full p-2 border rounded h-32" value={contractData.scope} onChange={(e) => setContractData({...contractData, scope: e.target.value})} disabled={isGenerating}></textarea>
          </div>

          <div className="flex justify-between mt-8">
            <Link href="/dashboard" className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 flex items-center"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
            <button onClick={showSignatureModal} disabled={isGenerating || !contractData.guestName || !contractData.guestEmail} className={`px-6 py-2 rounded-md text-white flex items-center ${isGenerating || !contractData.guestName || !contractData.guestEmail ? 'bg-blue-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
              {isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>Sending...</>) : (<><PenTool className="h-4 w-4 mr-2" /> Sign & Send Contract</>)}
            </button>
          </div>
        </>
      )}
      
      {showSignatureStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center"><PenTool className="h-5 w-5 mr-2" />Admin Signature Required</h2>
              <button onClick={() => setShowSignatureStep(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-gray-600 mb-4">Sign below to authorize sending this contract to <strong>{contractData.guestEmail}</strong></p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <canvas ref={canvasRef} width={400} height={200} className="border-2 border-blue-300 rounded cursor-crosshair w-full bg-white" style={{ touchAction: 'none' }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
              <p className="text-sm text-gray-600 mt-2 text-center">Draw your signature above</p>
            </div>
            <div className="flex justify-between mb-4">
              <button onClick={clearSignature} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"><X className="h-4 w-4 mr-2" /> Clear</button>
              <button onClick={saveSignature} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"><Check className="h-4 w-4 mr-2" /> Save Signature</button>
            </div>
            {adminSignature && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md"><p className="text-green-800 text-sm flex items-center"><Check className="h-4 w-4 mr-2" /> Signature saved!</p></div>)}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSignatureStep(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
              <button onClick={signAndSendContract} disabled={!adminSignature || isGenerating} className={`px-6 py-2 rounded-md text-white flex items-center ${!adminSignature || isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                {isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>Sending...</>) : (<><Send className="h-4 w-4 mr-2" /> Sign & Send to Guest</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
