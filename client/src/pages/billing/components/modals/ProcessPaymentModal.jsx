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
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientBills(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatientBills = async (patientId) => {
    try {
      console.log('🔄 Loading bills for patient:', patientId);
      const response = await billingAPI.getPatientBillings(patientId);
      console.log('📊 Patient bills response:', response.data);
      
      // Handle both response structures
      let bills = [];
      if (response.data?.data?.final_bills) {
        // Use final bills specifically
        bills = response.data.data.final_bills;
      } else if (response.data?.data?.billings) {
        // Filter to only show final bills from combined array
        bills = response.data.data.billings.filter(bill => 
          bill.type === 'final_bill' || bill.bill_number?.startsWith('BILL')
        );
      } else if (Array.isArray(response.data)) {
        bills = response.data.filter(bill => bill.bill_number?.startsWith('BILL'));
      }
      
      console.log('🎫 Final bills found:', bills);
      setPatientBills(bills);
    } catch (error) {
      console.error('Error loading patient bills:', error);
      setPatientBills([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBill) {
      alert('Please select a bill to process payment');
      return;
    }

    setLoading(true);

    try {
      // Process payment for the selected bill
      await billingAPI.processPayment(selectedBill.id, paymentData);
      alert('Payment processed successfully!');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      resetForm();
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      alert(error.response?.data?.message || 'Failed to process payment. Check console for details.');
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

  // Filter bills to only show those with outstanding balance
  const pendingBills = patientBills.filter(bill => {
    const balance = parseFloat(bill.balance || bill.total_amount || 0);
    return balance > 0;
  });

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
            onPatientSelect={(patient) => {
              console.log('🎯 Patient selected:', patient);
              setSelectedPatient(patient);
            }}
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
            {pendingBills.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pendingBills.map(bill => {
                  const billBalance = parseFloat(bill.balance || bill.total_amount || 0);
                  const billTotal = parseFloat(bill.total_amount || 0);
                  const amountPaid = parseFloat(bill.amount_paid || 0);
                  
                  return (
                    <div
                      key={bill.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBill?.id === bill.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        console.log('💰 Bill selected:', bill);
                        setSelectedBill(bill);
                        setPaymentData(prev => ({
                          ...prev,
                          amount_paid: billBalance.toFixed(2)
                        }));
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {bill.bill_number || `Bill #${bill.id}`}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            <div>Total: ${billTotal.toFixed(2)}</div>
                            <div>Paid: ${amountPaid.toFixed(2)}</div>
                            <div className="font-semibold">Balance Due: ${billBalance.toFixed(2)}</div>
                          </div>
                          {bill.service_type && (
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              Service: {bill.service_type.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          billBalance === 0 
                            ? 'bg-green-100 text-green-800' 
                            : bill.payment_status === 'Partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {billBalance === 0 ? 'Paid' : bill.payment_status || 'Pending'}
                        </span>
                      </div>
                      {bill.bill_date && (
                        <div className="text-xs text-gray-500 mt-2">
                          Bill Date: {new Date(bill.bill_date).toLocaleDateString()}
                          {bill.due_date && ` • Due: ${new Date(bill.due_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="mb-2">No pending bills found for this patient</div>
                <div className="text-sm">All bills are fully paid or no final bills generated yet.</div>
              </div>
            )}
          </div>
        )}

        {/* Payment Details */}
        {selectedBill && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">3. Payment Details</h3>
            
            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Bill Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bill Number:</span>
                  <div className="font-medium">{selectedBill.bill_number || `Bill #${selectedBill.id}`}</div>
                </div>
                <div>
                  <span className="text-gray-600">Balance Due:</span>
                  <div className="font-medium text-red-600">
                    ${parseFloat(selectedBill.balance || selectedBill.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

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
                  Amount to Pay ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentData.amount_paid}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    amount_paid: e.target.value 
                  }))}
                  max={parseFloat(selectedBill.balance || selectedBill.total_amount || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maximum: ${parseFloat(selectedBill.balance || selectedBill.total_amount || 0).toFixed(2)}
                </div>
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

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {loading ? 'Processing...' : 'Process Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProcessPaymentModal;