import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, CreditCard, X, User } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import { billingAPI, admissionAPI, patientAPI } from '../../../../services/api';
import PatientSearch from '../PatientSearch';

const GenerateFinalBillModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientBillings, setPatientBillings] = useState([]);
  const [patientAdmissions, setPatientAdmissions] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [billBillings, setBillBillings] = useState([]); // NEW: Store billings that went into the bill
  const [showPreview, setShowPreview] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setDebugInfo('Modal opened');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPatient) {
      setDebugInfo(`Patient selected: ${selectedPatient.first_name} ${selectedPatient.last_name} (ID: ${selectedPatient.id})`);
      loadPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatientData = async (patientId) => {
    try {
      setLoading(true);
      setDebugInfo(`Loading data for patient ID: ${patientId}`);
      
      console.log('🔄 Loading patient billings...');
      const billingResponse = await billingAPI.getPatientBillings(patientId);
      console.log('📊 Billing response:', billingResponse.data);
      const billings = billingResponse.data?.billings || billingResponse.data?.data?.billings || [];
      setPatientBillings(billings);
      setDebugInfo(prev => prev + ` | Billings loaded: ${billings.length}`);

      console.log('🔄 Loading patient admissions...');
      const admissionsResponse = await admissionAPI.getAll({ 
        patient_id: patientId 
      });
      console.log('🏥 Admissions response:', admissionsResponse.data);
      const admissions = admissionsResponse.data?.admissions || admissionsResponse.data?.data?.admissions || [];
      setPatientAdmissions(admissions);
      setDebugInfo(prev => prev + ` | Admissions loaded: ${admissions.length}`);
      
      const dischargedAdmission = admissions.find(
        admission => admission.status === 'Discharged'
      );
      if (dischargedAdmission) {
        setSelectedAdmission(dischargedAdmission);
        setDebugInfo(prev => prev + ` | Discharged admission found: ID ${dischargedAdmission.id}`);
      } else {
        const anyAdmission = admissions[0];
        if (anyAdmission) {
          setSelectedAdmission(anyAdmission);
          setDebugInfo(prev => prev + ` | Using admission: ID ${anyAdmission.id} (Status: ${anyAdmission.status})`);
        } else {
          setDebugInfo(prev => prev + ` | No admissions found`);
        }
      }
      
    } catch (error) {
      console.error('💥 Error loading patient data:', error);
      setDebugInfo(prev => prev + ` | Error: ${error.message}`);
      setPatientBillings([]);
      setPatientAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const pendingBillings = patientBillings.filter(billing => !billing.is_paid);
    
    const totalAmount = pendingBillings.reduce((sum, billing) => {
      return sum + (parseFloat(billing.total_amount) || 0);
    }, 0);

    const paidAmount = patientBillings
      .filter(billing => billing.is_paid)
      .reduce((sum, billing) => sum + (parseFloat(billing.total_amount) || 0), 0);

    return {
      totalAmount,
      paidAmount,
      balance: totalAmount - paidAmount,
      pendingCount: pendingBillings.length
    };
  };

  const handleGenerateBill = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      setDebugInfo('Starting bill generation...');
      
      console.log('🎫 Generating final bill with data:', {
        admission_id: selectedAdmission?.id,
        patient_id: selectedPatient.id
      });

      const response = await billingAPI.generateFinalBill({
        admission_id: selectedAdmission?.id || null,
        patient_id: selectedPatient.id
      });
      
      console.log('✅ Bill generated:', response.data);
      setGeneratedBill(response.data.bill);
      setBillBillings(response.data.billings || []); // Store the billings
      setShowPreview(true);
      setDebugInfo(`Bill generated successfully! Bill #${response.data.bill.bill_number}`);
      
    } catch (error) {
      console.error('❌ Generate bill error:', error);
      console.error('Error details:', error.response?.data);
      setDebugInfo(`Error: ${error.response?.data?.message || error.message}`);
      alert(error.response?.data?.message || 'Failed to generate final bill. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = () => {
    if (generatedBill) {
      setDebugInfo('Opening payment modal...');
      onClose();
      if (onSuccess) {
        onSuccess(generatedBill);
      }
    }
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById('bill-preview').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientBillings([]);
    setPatientAdmissions([]);
    setSelectedAdmission(null);
    setGeneratedBill(null);
    setBillBillings([]);
    setShowPreview(false);
    setDebugInfo('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const { totalAmount, paidAmount, balance, pendingCount } = calculateTotals();
  const pendingBillings = patientBillings.filter(billing => !billing.is_paid);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showPreview ? "Final Bill Preview" : "Generate Final Bill"}
      size="lg"
    >
      {/* Debug Information */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <div className="text-sm text-blue-800 font-mono">
          <strong>Debug:</strong> {debugInfo || 'Ready'}
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Patient *
            </label>
            <PatientSearch
              selectedPatient={selectedPatient}
              onPatientSelect={setSelectedPatient}
              onClearPatient={() => {
                setSelectedPatient(null);
                setPatientBillings([]);
                setPatientAdmissions([]);
                setSelectedAdmission(null);
                setDebugInfo('Patient selection cleared');
              }}
            />
          </div>

          {selectedPatient && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Billing Summary for {selectedPatient.first_name} {selectedPatient.last_name}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Billings</div>
                  <div>Total: {patientBillings.length}</div>
                  <div>Pending: {pendingCount}</div>
                  <div>Paid: {patientBillings.length - pendingCount}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Admissions</div>
                  <div>Total: {patientAdmissions.length}</div>
                  <div>Discharged: {patientAdmissions.filter(a => a.status === 'Discharged').length}</div>
                  <div>Selected: {selectedAdmission ? `ID ${selectedAdmission.id}` : 'None'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total Amount</div>
                  <div className="text-2xl font-bold text-blue-900">${totalAmount.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Paid Amount</div>
                  <div className="text-2xl font-bold text-green-900">${paidAmount.toFixed(2)}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">Balance Due</div>
                  <div className="text-2xl font-bold text-yellow-900">${balance.toFixed(2)}</div>
                </div>
              </div>

              {patientAdmissions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Admission Information</h4>
                  <select
                    value={selectedAdmission?.id || ''}
                    onChange={(e) => {
                      const admission = patientAdmissions.find(a => a.id === parseInt(e.target.value));
                      setSelectedAdmission(admission);
                      setDebugInfo(`Admission selected: ID ${admission?.id} (${admission?.status})`);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select admission (optional)</option>
                    {patientAdmissions.map(admission => (
                      <option key={admission.id} value={admission.id}>
                        {admission.status} - {new Date(admission.admission_date).toLocaleDateString()}
                        {admission.discharge_date && ` to ${new Date(admission.discharge_date).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h4 className="font-medium text-gray-900">
                    Pending Service Charges ({pendingCount})
                  </h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {pendingBillings.length > 0 ? (
                    pendingBillings.map((billing) => (
                      <div key={billing.id} className="border-b last:border-b-0">
                        <div className="px-4 py-3 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900 capitalize">
                              {billing.service_type?.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {billing.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {billing.quantity} × ${billing.unit_price}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ${billing.total_amount}
                            </div>
                            <div className="text-xs text-yellow-600">
                              Pending
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      {patientBillings.length === 0 
                        ? 'No billing records found for this patient'
                        : 'All bills have been paid. No pending charges.'
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateBill}
                  disabled={loading || pendingCount === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : `Generate Final Bill (${pendingCount} items)`}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6" id="bill-preview">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-green-800">
              ✓ Bill generated successfully! Ready for payment.
            </div>
          </div>
          
          {/* Bill Header */}
          <div className="bg-white border rounded-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">FINAL BILL</h2>
              <p className="text-sm text-gray-600">Bill #{generatedBill?.bill_number}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
                <p className="text-sm">{selectedPatient?.first_name} {selectedPatient?.last_name}</p>
                <p className="text-sm text-gray-600">ID: {selectedPatient?.patient_id || selectedPatient?.id}</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-700 mb-2">Bill Date</h3>
                <p className="text-sm">{new Date(generatedBill?.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Due: {new Date(generatedBill?.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill Items */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Service Charges</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billBillings.map((billing, index) => (
                    <tr key={billing.id || index} className="border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium capitalize">
                          {billing.service_type?.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-600">{billing.description}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{billing.quantity}</td>
                      <td className="px-4 py-3 text-right">${billing.unit_price}</td>
                      <td className="px-4 py-3 text-right font-medium">${billing.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Total Amount:</td>
                    <td className="px-4 py-3 text-right text-lg">${generatedBill?.total_amount}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Balance Due:</td>
                    <td className="px-4 py-3 text-right text-lg text-red-600">${generatedBill?.balance}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handleProcessPayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GenerateFinalBillModal;