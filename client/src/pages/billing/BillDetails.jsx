import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { billingAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';

const BillDetails = () => {
  const { id } = useParams();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: '',
    insurance_claim_number: ''
  });

  const { data, loading, error, execute } = useApi(
    () => billingAPI.getPatientBillings(id),
    true
  );

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await billingAPI.processPayment(id, paymentData);
      setShowPaymentModal(false);
      execute(); // Refresh data
      alert('Payment processed successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <FileText className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bill not found</h3>
        <p className="text-gray-600 mb-4">The bill you're looking for doesn't exist.</p>
        <Link to="/billing">
          <Button variant="primary">
            Back to Billing
          </Button>
        </Link>
      </div>
    );
  }

  const { billings, summary } = data.data;
  const patient = billings[0]?.patient;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/billing"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bill Details</h1>
            <p className="text-gray-600">
              Patient: {patient?.first_name} {patient?.last_name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {summary.pendingAmount > 0 && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Patient Name</label>
                <p className="text-gray-900">
                  {patient?.first_name} {patient?.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Patient ID</label>
                <p className="font-mono text-gray-900">{patient?.patient_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID Number</label>
                <p className="text-gray-900">{patient?.id_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{patient?.phone_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Items</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(item.service_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">{item.description}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {item.service_type}
                        </div>
                      </td>
                      <td className="text-sm text-gray-900">{item.quantity}</td>
                      <td className="text-sm text-gray-900">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="text-sm font-medium text-gray-900">
                        ${parseFloat(item.total_amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_paid 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.is_paid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-gray-900">
                  ${summary.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">
                  ${summary.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-900 font-semibold">Balance Due:</span>
                <span className={`font-bold text-lg ${
                  summary.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${summary.pendingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {summary.pendingAmount > 0 && (
              <Button 
                className="w-full mt-4"
                onClick={() => setShowPaymentModal(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            )}
          </div>

          {/* Payment History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            <div className="space-y-3">
              {billings
                .filter(item => item.is_paid)
                .map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.description}
                      </div>
                      <div className="text-gray-500">
                        {new Date(item.service_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-green-600 font-medium">
                      +${parseFloat(item.total_amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              
              {billings.filter(item => item.is_paid).length === 0 && (
                <p className="text-gray-500 text-sm text-center">No payments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Process Payment"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Pay
            </label>
            <Input
              type="number"
              step="0.01"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                amount: e.target.value
              }))}
              placeholder="0.00"
              max={summary.pendingAmount}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum: ${summary.pendingAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                payment_method: e.target.value
              }))}
              className="input"
              required
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Insurance">Insurance</option>
            </select>
          </div>

          {paymentData.payment_method === 'Insurance' && (
            <Input
              label="Insurance Claim Number"
              value={paymentData.insurance_claim_number}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                insurance_claim_number: e.target.value
              }))}
              placeholder="Enter claim number"
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillDetails;