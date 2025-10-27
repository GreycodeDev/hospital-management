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
  const [billBillings, setBillBillings] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (billBillings.length > 0) {
      console.log('🔄 billBillings updated:', billBillings);
    }
  }, [billBillings]);

  const loadPatientData = async (patientId) => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading patient billings...');
      const billingResponse = await billingAPI.getPatientBillings(patientId);
      console.log('📊 Billing response:', billingResponse.data);
      
      // Handle different response structures
      let billings = [];
      if (billingResponse.data?.billings) {
        billings = billingResponse.data.billings;
      } else if (billingResponse.data?.data?.billings) {
        billings = billingResponse.data.data.billings;
      } else if (Array.isArray(billingResponse.data)) {
        billings = billingResponse.data;
      }
      
      setPatientBillings(billings);

      console.log('🔄 Loading patient admissions...');
      const admissionsResponse = await admissionAPI.getAll({ 
        patient_id: patientId 
      });
      console.log('🏥 Admissions response:', admissionsResponse.data);
      
      let admissions = [];
      if (admissionsResponse.data?.admissions) {
        admissions = admissionsResponse.data.admissions;
      } else if (admissionsResponse.data?.data?.admissions) {
        admissions = admissionsResponse.data.data.admissions;
      } else if (Array.isArray(admissionsResponse.data)) {
        admissions = admissionsResponse.data;
      }
      
      setPatientAdmissions(admissions);
      
      const dischargedAdmission = admissions.find(
        admission => admission.status === 'Discharged'
      );
      if (dischargedAdmission) {
        setSelectedAdmission(dischargedAdmission);
      } else {
        const anyAdmission = admissions[0];
        if (anyAdmission) {
          setSelectedAdmission(anyAdmission);
        } else {
          console.log('ℹ️ No admissions found for this patient');
        }
      }
      
    } catch (error) {
      console.error('💥 Error loading patient data:', error);
      setPatientBillings([]);
      setPatientAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    // Filter only billing items (not final bills) and unpaid ones
    const pendingBillings = patientBillings.filter(billing => 
      billing.type !== 'final_bill' && !billing.is_paid
    );
    
    const totalAmount = pendingBillings.reduce((sum, billing) => {
      return sum + (parseFloat(billing.total_amount) || 0);
    }, 0);

    const paidAmount = patientBillings
      .filter(billing => billing.type !== 'final_bill' && billing.is_paid)
      .reduce((sum, billing) => sum + (parseFloat(billing.total_amount) || 0), 0);

    return {
      totalAmount,
      paidAmount,
      balance: totalAmount - paidAmount,
      pendingCount: pendingBillings.length
    };
  };

  const handleGenerateBill = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setLoading(true);
    try {
      
      console.log('🎫 Generating final bill with data:', {
        admission_id: selectedAdmission?.id,
        patient_id: selectedPatient.id
      });

      const response = await billingAPI.generateFinalBill({
        admission_id: selectedAdmission?.id || null,
        patient_id: selectedPatient.id
      });
      
      console.log('✅ Bill generated:', response.data);
      console.log('📋 Billings data structure:', response.data.data?.billings);
      console.log('📄 Bill data structure:', response.data.data?.bill);
      
      // Verify billings data
      const billingsData = response.data.data?.billings || response.data.billings || [];
      if (billingsData && Array.isArray(billingsData)) {
        console.log(`📊 Number of billings: ${billingsData.length}`);
        billingsData.forEach((billing, index) => {
          console.log(`Billing ${index + 1}:`, {
            id: billing.id,
            service_type: billing.service_type,
            description: billing.description,
            quantity: billing.quantity,
            unit_price: billing.unit_price,
            total_amount: billing.total_amount
          });
        });
      } else {
        console.warn('⚠️ No billings array found in response');
      }

      setGeneratedBill(response.data.data?.bill || response.data.bill);
      setBillBillings(billingsData);
      setShowPreview(true);
      
    } catch (error) {
      console.error('❌ Generate bill error:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to generate final bill. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = () => {
    if (generatedBill) {
      onClose();
      if (onSuccess) {
        onSuccess(generatedBill);
      }
    }
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById('bill-preview');
    
    if (!printContent) {
      alert('Bill content not found');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Final Bill - ${generatedBill?.bill_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.4;
            }
            .bill-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 30px;
              background: white;
            }
            .bill-header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .bill-header h1 {
              margin: 0;
              font-size: 28px;
              color: #333;
            }
            .bill-info { 
              display: flex; 
              justify-content: space-between;
              margin-bottom: 30px;
              flex-wrap: wrap;
            }
            .patient-info, .bill-details {
              flex: 1;
              min-width: 250px;
              margin-bottom: 15px;
            }
            .bill-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .bill-table th,
            .bill-table td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            .bill-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .bill-table tfoot td {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .total-row {
              font-size: 16px;
            }
            .balance-due {
              color: #dc2626;
              font-size: 18px;
            }
            .service-description {
              max-width: 300px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .mb-4 {
              margin-bottom: 1rem;
            }
            .mt-4 {
              margin-top: 1rem;
            }
            .instructions {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              .bill-container {
                border: none;
                padding: 0;
              }
              .no-print { 
                display: none; 
              }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientBillings([]);
    setPatientAdmissions([]);
    setSelectedAdmission(null);
    setGeneratedBill(null);
    setBillBillings([]);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const { totalAmount, paidAmount, balance, pendingCount } = calculateTotals();
  const pendingBillings = patientBillings.filter(billing => 
    billing.type !== 'final_bill' && !billing.is_paid
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showPreview ? "Final Bill Preview" : "Generate Final Bill"}
      size="xl"
    >

     

      {!showPreview ? (
        <div className="space-y-6 px-2 py-24">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Patient *
            </label>
            <PatientSearch
              selectedPatient={selectedPatient}
              onPatientSelect={(patient) => {
                console.log('🎯 Patient selected from search:', patient);
                setSelectedPatient(patient);
              }}
              onClearPatient={() => {
                setSelectedPatient(null);
                setPatientBillings([]);
                setPatientAdmissions([]);
                setSelectedAdmission(null);
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
                  <div>Total: {patientBillings.filter(b => b.type !== 'final_bill').length}</div>
                  <div>Pending: {pendingCount}</div>
                  <div>Paid: {patientBillings.filter(b => b.type !== 'final_bill' && b.is_paid).length}</div>
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
                              {billing.service_type?.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {billing.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {billing.quantity} × ${parseFloat(billing.unit_price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ${parseFloat(billing.total_amount || 0).toFixed(2)}
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
          {/* Success Message - Hidden in print */}
          <div className="p-4 bg-green-50 rounded-lg no-print">
            <div className="text-green-800">
              ✓ Bill generated successfully! Ready for payment.
            </div>
          </div>
          
          {/* Bill Header */}
          <div className="bg-white">
            <div className="bill-header">
              <h1>FINAL BILL</h1>
              <p className="text-lg">Bill #: <strong>{generatedBill?.bill_number}</strong></p>
            </div>

            <div className="bill-info">
              <div className="patient-info">
                <h3 className="font-semibold mb-2">PATIENT INFORMATION</h3>
                <p><strong>Name:</strong> {selectedPatient?.first_name} {selectedPatient?.last_name}</p>
                <p><strong>Patient ID:</strong> {selectedPatient?.patient_id || selectedPatient?.id}</p>
                {selectedPatient?.phone && (
                  <p><strong>Phone:</strong> {selectedPatient.phone}</p>
                )}
              </div>
              <div className="bill-details">
                <h3 className="font-semibold mb-2">BILL INFORMATION</h3>
                <p><strong>Bill Date:</strong> {new Date(generatedBill?.createdAt).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(generatedBill?.due_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {generatedBill?.balance === 0 ? 'PAID' : 'PENDING PAYMENT'}</p>
              </div>
            </div>

            {/* Bill Items */}
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-3">SERVICE CHARGES</h3>
              <table className="bill-table">
                <thead>
                  <tr>
                    <th width="50%">Service Description</th>
                    <th width="10%" className="text-center">Qty</th>
                    <th width="20%" className="text-right">Unit Price ($)</th>
                    <th width="20%" className="text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {billBillings && billBillings.length > 0 ? (
                    billBillings.map((billing, index) => (
                      <tr key={billing.id || index}>
                        <td className="service-description">
                          <div className="font-medium capitalize">
                            {billing.service_type?.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {billing.description}
                          </div>
                        </td>
                        <td className="text-center">{billing.quantity || 1}</td>
                        <td className="text-right">${parseFloat(billing.unit_price || 0).toFixed(2)}</td>
                        <td className="text-right font-medium">
                          ${parseFloat(billing.total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No service charges found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="3" className="text-right"><strong>Total Amount:</strong></td>
                    <td className="text-right">
                      <strong>${parseFloat(generatedBill?.total_amount || 0).toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="3" className="text-right"><strong>Amount Paid:</strong></td>
                    <td className="text-right">
                      <strong>${parseFloat(generatedBill?.amount_paid || 0).toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr className="balance-due">
                    <td colSpan="3" className="text-right"><strong>BALANCE DUE:</strong></td>
                    <td className="text-right">
                      <strong>${parseFloat(generatedBill?.balance || 0).toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Instructions */}
            <div className="instructions">
              <p><strong>Payment Instructions:</strong></p>
              <p>Please make payment by the due date. Late payments may incur additional charges.</p>
              <p>For billing inquiries, please contact our billing department.</p>
            </div>
          </div>
          
          {/* Action Buttons - Hidden in print */}
          <div className="flex justify-between no-print">
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