import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/ui/Modal';
import PatientSearch from '../PatientSearch';
import { billingAPI } from '../../../../services/api';

const ProcessPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientBills, setPatientBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_method: 'cash',
    insurance_claim_number: ''
  });

  useEffect(() => {
    if (selectedPatient) {
      loadPatientBills(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatientBills = async (patientId) => {
    try {
      const response = await billingAPI.getPatientBillings(patientId);
      setPatientBills(response.data?.billings || []);
    } catch (error) {
      console.error('Error loading patient bills:', error);
      setPatientBills([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await billingAPI.processPayment(selectedBill.id, paymentData);
      alert('Payment processed successfully!');
      onClose();
      onSuccess();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentData({
      amount_paid: '',
      payment_method: 'cash',
      insurance_claim_number: ''
    });
    setSelectedPatient(null);
    setSelectedBill(null);
    setPatientBills([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Process Payment"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">1. Select Patient</h3>
          <PatientSearch
            selectedPatient={selectedPatient}
            onPatientSelect={setSelectedPatient}
            onClearPatient={() => {
              setSelectedPatient(null);
              setPatientBills([]);
              setSelectedBill(null);
            }}
          />
        </div>

        {/* Bill Selection */}
        {selectedPatient && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">2. Select Bill</h3>
            {patientBills.length > 0 ? (
              <div className="space-y-2">
                {patientBills.map(bill => (
                  <div
                    key={bill.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedBill?.id === bill.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedBill(bill);
                      setPaymentData(prev => ({
                        ...prev,
                        amount_paid: bill.balance || bill.total_amount
                      }));
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {bill.bill_number || `Service: ${bill.service_type}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: ${bill.total_amount} • Balance: ${bill.balance || bill.total_amount}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.balance === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bill.balance === 0 ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No bills found for this patient
              </div>
            )}
          </div>
        )}

        {/* Payment Details */}
        {selectedBill && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">3. Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount_paid}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount_paid: parseFloat(e.target.value) }))}
                  max={selectedBill.balance || selectedBill.total_amount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {paymentData.payment_method === 'insurance' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Claim Number *
                </label>
                <input
                  type="text"
                  value={paymentData.insurance_claim_number}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedPatient || !selectedBill}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProcessPaymentModal;