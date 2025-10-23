import React, { useState } from 'react';
import { Search, DollarSign, FileText, Calendar } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { billingAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: billingStats, loading: statsLoading } = useApi(billingAPI.getStats);
  const { data, loading, execute } = useApi(
    () => billingAPI.getPatientBillings('all', { page: currentPage, limit: 10 }),
    false
  );

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${billingStats?.data?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Revenue',
      value: `$${billingStats?.data?.pendingRevenue?.toLocaleString() || '0'}`,
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Bills',
      value: billingStats?.data?.totalBills || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Paid Bills',
      value: billingStats?.data?.paidBills || 0,
      icon: DollarSign,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage patient billing and payments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue by Service Type */}
      {billingStats?.data?.revenueByService && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(billingStats.data.revenueByService).map(([service, revenue]) => (
              <div key={service} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-600">{service}</div>
                <div className="text-lg font-bold text-gray-900">
                  ${revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search bills by patient name or bill number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Recent Bills */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample data - replace with actual data */}
              <tr className="hover:bg-gray-50">
                <td className="font-mono text-sm">BILL2301001</td>
                <td>
                  <div className="font-medium text-gray-900">John Doe</div>
                  <div className="text-sm text-gray-500">ID: VCH123456</div>
                </td>
                <td className="font-medium">$1,250.00</td>
                <td>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                  </span>
                </td>
                <td>
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    2023-10-15
                  </div>
                </td>
                <td>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="font-mono text-sm">BILL2301002</td>
                <td>
                  <div className="font-medium text-gray-900">Jane Smith</div>
                  <div className="text-sm text-gray-500">ID: VCH123457</div>
                </td>
                <td className="font-medium">$850.00</td>
                <td>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
                <td>
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    2023-10-16
                  </div>
                </td>
                <td>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <Button variant="outline">
            View All Bills
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payment</h3>
          <p className="text-gray-600 mb-4">Record payments for patient bills</p>
          <Button className="w-full">
            Process Payment
          </Button>
        </div>
        
        <div className="card p-6 text-center">
          <FileText className="h-8 w-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Bill</h3>
          <p className="text-gray-600 mb-4">Create bills for discharged patients</p>
          <Button className="w-full">
            Generate Bill
          </Button>
        </div>
        
        <div className="card p-6 text-center">
          <Search className="h-8 w-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Inquiry</h3>
          <p className="text-gray-600 mb-4">Search and view billing details</p>
          <Button variant="outline" className="w-full">
            Search Bills
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Billing;