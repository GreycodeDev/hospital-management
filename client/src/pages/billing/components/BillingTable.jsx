import React from 'react';
import { Calendar, Eye, DollarSign } from 'lucide-react';

const BillingTable = ({ billsData, loading, currentPage, setCurrentPage, onProcessPayment }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Helper function to get service type from bill
  const getServiceType = (bill) => {
    // If it's a final bill, show "Multiple Services" or check if there's a specific service type
    if (bill.service_type) {
      return bill.service_type;
    }
    
    // For final bills that aggregate multiple services
    if (bill.bill_number?.startsWith('BILL')) {
      return 'Multiple Services';
    }
    
    // Default fallback
    return 'Medical Services';
  };

  // Helper function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to get display date (prefer bill_date, then createdAt, then created_at)
  const getDisplayDate = (bill) => {
    return bill.bill_date || bill.createdAt || bill.created_at || bill.service_date;
  };

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {billsData?.data?.bills?.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium">
                  {bill.bill_number || `B-${bill.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {bill.patient?.first_name && bill.patient?.last_name 
                      ? `${bill.patient.first_name} ${bill.patient.last_name}`
                      : bill.patient?.name || 'N/A'
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {bill.patient?.patient_id || bill.patient_id || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getServiceType(bill)?.replace(/_/g, ' ') || 'Medical Service'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  ${parseFloat(bill.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  <span className={parseFloat(bill.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                    ${parseFloat(bill.balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bill.payment_status === 'Paid' || parseFloat(bill.balance || 0) === 0
                      ? 'bg-green-100 text-green-800'
                      : bill.payment_status === 'Partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bill.payment_status || (parseFloat(bill.balance || 0) === 0 ? 'Paid' : 'Pending')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(getDisplayDate(bill))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {(bill.payment_status === 'Pending' || bill.payment_status === 'Partial' || parseFloat(bill.balance || 0) > 0) && (
                      <button 
                        onClick={() => onProcessPayment(bill)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Process Payment"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            
            {(!billsData?.data?.bills || billsData.data.bills.length === 0) && (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-lg font-medium text-gray-900">No bills found</p>
                    <p className="text-sm text-gray-500">No billing records available</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {billsData?.data?.pagination && billsData.data.pagination.total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((billsData.data.pagination.currentPage - 1) * billsData.data.pagination.limit) + 1} to{' '}
            {Math.min(billsData.data.pagination.currentPage * billsData.data.pagination.limit, billsData.data.pagination.total)} of{' '}
            {billsData.data.pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              disabled={billsData.data.pagination.currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {billsData.data.pagination.currentPage} of {billsData.data.pagination.totalPages}
            </span>
            <button
              disabled={billsData.data.pagination.currentPage >= billsData.data.pagination.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingTable;