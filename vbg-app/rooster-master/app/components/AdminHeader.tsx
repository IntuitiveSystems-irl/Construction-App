
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Receipt, 
  Calculator,
  Settings,
  Home,
  Bell
} from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string, name: string) => {
    router.push(href);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Users',
      href: '/dashboard?tab=admin',
      icon: Users,
      current: pathname === '/dashboard' || pathname.startsWith('/admin/user-details')
    },
    {
      name: 'Contracts',
      href: '/contracts',
      icon: FileText,
      current: pathname.startsWith('/contracts') || pathname.startsWith('/admin/contracts')
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: DollarSign,
      current: pathname.startsWith('/invoices')
    },
    {
      name: 'Receipts',
      href: '/receipts',
      icon: Receipt,
      current: pathname.startsWith('/receipts')
    },
    {
      name: 'Estimates',
      href: '/estimates',
      icon: Calculator,
      current: pathname.startsWith('/estimates')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings')
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with title */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleNavigation('/admin/invoices', 'Test')}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
            >
              Test Nav
            </button>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex space-x-8 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, item.name)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  item.current
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
