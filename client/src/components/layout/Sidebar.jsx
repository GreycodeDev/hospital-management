import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bed, 
  FileText, 
  CreditCard, 
  Settings,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Admissions', href: '/admissions', icon: Stethoscope },
    { name: 'Bed Management', href: '/beds', icon: Bed },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  // Add admin-only routes
  if (user?.role === 'admin') {
    navigation.push(
      { name: 'Users', href: '/users', icon: Settings }
    );
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
          <span className="ml-2 text-xl font-bold text-gray-800">
            Victoria Hospital
          </span>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;