import React from 'react';
import { DollarSign, FileText } from 'lucide-react';

const BillingStats = ({ stats, loading }) => {
  const statItems = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Revenue',
      value: `$${stats?.pendingRevenue?.toLocaleString() || '0'}`,
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Bills',
      value: stats?.totalBills || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Paid Bills',
      value: stats?.paidBills || 0,
      icon: DollarSign,
      color: 'bg-green-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-6 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((stat, index) => {
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
  );
};

export default BillingStats;