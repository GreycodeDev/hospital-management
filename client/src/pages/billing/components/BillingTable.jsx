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
                Amount
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
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                  {bill.bill_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {bill.patient?.name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {bill.patient?.patient_id || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {bill.service_type?.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  ${bill.total_amount?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bill.payment_status === 'Paid' || bill.balance === 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bill.payment_status || (bill.balance === 0 ? 'Paid' : 'Pending')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(bill.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    {(bill.payment_status === 'Pending' || bill.balance > 0) && (
                      <button 
                        onClick={() => onProcessPayment(bill)}
                        className="text-green-600 hover:text-green-900"
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
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No bills found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {billsData?.data?.pagination && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((billsData.data.pagination.currentPage - 1) * billsData.data.pagination.limit) + 1} to{' '}
            {Math.min(billsData.data.pagination.currentPage * billsData.data.pagination.limit, billsData.data.pagination.total)} of{' '}
            {billsData.data.pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              disabled={billsData.data.pagination.currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={billsData.data.pagination.currentPage >= billsData.data.pagination.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
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