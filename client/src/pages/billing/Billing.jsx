import React, { useState, useEffect } from 'react';
import { Search, DollarSign, FileText, Calendar, Eye, Plus, Filter, X, User, CreditCard } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { billingAPI, patientAPI, admissionAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Payment modal states
  const [dischargedPatients, setDischargedPatients] = useState([]);
  const [paymentPatientSearch, setPaymentPatientSearch] = useState('');
  const [selectedPaymentPatient, setSelectedPaymentPatient] = useState(null);
  const [patientBills, setPatientBills] = useState([]);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  
  // Create bill modal states
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    patient_id: '',
    bill_id: '',
    amount_paid: '',
    payment_method: 'cash',
    insurance_claim_number: '',
    notes: ''
  });

  const [billData, setBillData] = useState({
    patient_id: '',
    service_type: 'consultation',
    description: '',
    quantity: 1,
    unit_price: '',
    date_of_service: new Date().toISOString().split('T')[0]
  });
  
  const { data: billingStats, loading: statsLoading, execute: refreshStats } = useApi(billingAPI.getStats);
  const { data: billsData, loading: billsLoading, execute: fetchBills } = useApi(
    () => billingAPI.getAllBills(filterStatus, { page: currentPage, limit: 10, search: searchTerm }),
    true
  );

  // Fetch all patients for payment modal
  const fetchAllPatients = async (search = '') => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll({ search }); // Use getAll instead of search
      setDischargedPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setDischargedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient bills when a patient is selected for payment
  const fetchPatientBills = async (patientId) => {
    try {
      setLoading(true);
      const response = await billingAPI.getPatientBillings(patientId);
      setPatientBills(response.data.billings || []);
    } catch (error) {
      console.error('Error fetching patient bills:', error);
      setPatientBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for create bill modal
// Fetch patients for create bill modal
const searchPatients = async (query) => {
  try {
    if (!query.trim()) {
      setPatientResults([]);
      return;
    }
    
    console.log('Searching patients with query:', query);
    
    let response;
    try {
      // Try the search endpoint
      response = await patientAPI.search(query);
      console.log('Search API response:', response.data);
    } catch (searchError) {
      console.log('Search API failed, trying getAll:', searchError);
      // Fallback to getAll with search parameter
      response = await patientAPI.getAll({ search: query });
      console.log('GetAll API response:', response.data);
    }
    
    // Extract patients from different possible response structures
    let patients = [];
    if (response.data) {
      if (Array.isArray(response.data.patients)) {
        patients = response.data.patients;
      } else if (Array.isArray(response.data.data?.patients)) {
        patients = response.data.data.patients;
      } else if (Array.isArray(response.data)) {
        patients = response.data;
      } else if (response.data.patients && typeof response.data.patients === 'object') {
        // If it's an object with patients property
        patients = Object.values(response.data.patients);
      }
    }
    
    console.log('Final patients array:', patients);
    setPatientResults(patients);
    
  } catch (error) {
    console.error('Error searching patients:', error);
    setPatientResults([]);
  }
};

  // Effects
  useEffect(() => {
    fetchBills();
  }, [currentPage, filterStatus]);

  useEffect(() => {
    if (paymentPatientSearch.length >= 2) {
      const timer = setTimeout(() => {
        fetchAllPatients(paymentPatientSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else if (paymentPatientSearch.length === 0) {
      fetchAllPatients();
    }
  }, [paymentPatientSearch]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchPatients(patientSearch);
        setShowPatientResults(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowPatientResults(false);
    }
  }, [patientSearch]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBills();
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate required fields
    if (!billData.patient_id || !billData.service_type || !billData.description || !billData.unit_price) {
      setErrors({ 
        general: 'Please fill all required fields: Patient, Service Type, Description, and Unit Price' 
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Sending bill data:', billData); // Debug log
      
      await billingAPI.addService(billData);
      alert('Service charge added successfully!');
      setShowCreateBillModal(false);
      resetCreateBillForm();
      refreshStats();
      fetchBills();
    } catch (error) {
      console.error('Create bill error:', error);
      setErrors({ 
        general: error.response?.data?.message || 'Failed to add service charge' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // First ensure we have a final bill
      if (selectedBillForPayment && !selectedBillForPayment.bill_number) {
        // This is a billing item, not a final bill - generate final bill first
        const billResponse = await billingAPI.generateFinalBill({
          admission_id: selectedBillForPayment.admission_id
        });
        
        // Then process payment against the generated bill
        await billingAPI.processPayment(billResponse.data.bill.id, {
          amount_paid: paymentData.amount_paid,
          payment_method: paymentData.payment_method,
          insurance_claim_number: paymentData.insurance_claim_number
        });
      } else {
        // Process payment against existing final bill
        await billingAPI.processPayment(selectedBillForPayment.id, {
          amount_paid: paymentData.amount_paid,
          payment_method: paymentData.payment_method,
          insurance_claim_number: paymentData.insurance_claim_number
        });
      }
      
      alert('Payment processed successfully!');
      setShowPaymentModal(false);
      resetPaymentForm();
      refreshStats();
      fetchBills();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to process payment' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentPatientSelect = (patient) => {
    setSelectedPaymentPatient(patient);
    setPaymentData(prev => ({ ...prev, patient_id: patient.id }));
    setPaymentPatientSearch('');
    fetchPatientBills(patient.id);
  };

  const handleBillSelect = (bill) => {
    setSelectedBillForPayment(bill);
    const paymentAmount = bill.balance > 0 ? bill.balance : (bill.total_amount - (bill.amount_paid || 0));
    setPaymentData(prev => ({
      ...prev,
      bill_id: bill.id,
      amount_paid: paymentAmount
    }));
  };

  const handlePatientSelect = (patient) => {
    console.log('Patient selected:', patient);
    
    // Make sure we're getting the patient object correctly
    if (!patient || !patient.id) {
      console.error('Invalid patient object:', patient);
      return;
    }
    
    setSelectedPatient(patient);
    
    // Update billData with the patient_id
    setBillData(prev => ({
      ...prev,
      patient_id: patient.id.toString() // Ensure it's a string
    }));
    
    // Update the search input to show the selected patient's name
    setPatientSearch(`${patient.first_name || ''} ${patient.last_name || ''}`.trim());
    setShowPatientResults(false);
    
    console.log('After selection - selectedPatient:', patient);
    console.log('After selection - billData.patient_id:', patient.id);
  };

  const resetCreateBillForm = () => {
    setBillData({
      patient_id: '',
      service_type: 'consultation',
      description: '',
      quantity: 1,
      unit_price: '',
      date_of_service: new Date().toISOString().split('T')[0]
    });
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const resetPaymentForm = () => {
    setPaymentData({
      patient_id: '',
      bill_id: '',
      amount_paid: '',
      payment_method: 'cash',
      insurance_claim_number: '',
      notes: ''
    });
    setSelectedPaymentPatient(null);
    setSelectedBillForPayment(null);
    setPatientBills([]);
    setPaymentPatientSearch('');
  };

 const clearPatientSelection = () => {
  console.log('Clearing patient selection');
  setSelectedPatient(null);
  setBillData(prev => ({ ...prev, patient_id: '' }));
  setPatientSearch('');
  setShowPatientResults(false);
};

  const clearPaymentPatientSelection = () => {
    setSelectedPaymentPatient(null);
    setSelectedBillForPayment(null);
    setPatientBills([]);
    setPaymentData(prev => ({ 
      ...prev, 
      patient_id: '', 
      bill_id: '', 
      amount_paid: '' 
    }));
    setPaymentPatientSearch('');
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    console.log('View bill:', bill);
  };

  // Data
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

const serviceTypes = [
  { value: 'Consultation', label: 'Consultation' },
  { value: 'Laboratory', label: 'Laboratory Test' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Procedure', label: 'Procedure' },
  { value: 'Room', label: 'Room Charges' },
  { value: 'Bed', label: 'Bed Charges' },
  { value: 'Medication', label: 'Medication' },
  { value: 'LabTest', label: 'LabTest' },
  { value: 'X-Ray', label: 'X-Ray' },
  { value: 'Other', label: 'Other' }
];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'bank_transfer', label: 'Bank Transfer' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage patient billing and payments</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowCreateBillModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          <Button variant="outline" onClick={() => setShowPaymentModal(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment
          </Button>
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
                <div className="text-sm font-medium text-gray-600 capitalize">
                  {service.replace('_', ' ')}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <form onSubmit={handleSearch} className="flex space-x-4 flex-1">
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
          
          <div className="flex items-center space-x-4">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
        </div>
        
        {billsLoading ? (
          <div className="flex justify-center p-8">
            <Loader />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Patient</th>
                    <th>Service Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billsData?.data?.bills?.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="font-mono text-sm">{bill.bill_number}</td>
                      <td>
                        <div className="font-medium text-gray-900">
                          {bill.patient?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {bill.patient?.patient_id || 'N/A'}
                        </div>
                      </td>
                      <td className="capitalize">{bill.service_type?.replace('_', ' ')}</td>
                      <td className="font-medium">${bill.total_amount?.toLocaleString()}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bill.payment_status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : bill.balance === 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bill.payment_status || (bill.balance === 0 ? 'Paid' : 'Pending')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(bill.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewBill(bill)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {(bill.payment_status === 'Pending' || bill.balance > 0) && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setPaymentData(prev => ({
                                  ...prev,
                                  bill_id: bill.id,
                                  patient_id: bill.patient_id,
                                  amount_paid: bill.balance || bill.total_amount
                                }));
                                setSelectedPaymentPatient({
                                  id: bill.patient_id,
                                  first_name: bill.patient?.name?.split(' ')[0],
                                  last_name: bill.patient?.name?.split(' ')[1],
                                  patient_id: bill.patient?.patient_id
                                });
                                setSelectedBillForPayment(bill);
                                setShowPaymentModal(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {(!billsData?.data?.bills || billsData.data.bills.length === 0) && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
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
                  <Button
                    variant="outline"
                    disabled={billsData.data.pagination.currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={billsData.data.pagination.currentPage >= billsData.data.pagination.totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <CreditCard className="h-8 w-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payment</h3>
          <p className="text-gray-600 mb-4">Record payments for patient bills</p>
          <Button 
            className="w-full"
            onClick={() => setShowPaymentModal(true)}
          >
            Process Payment
          </Button>
        </div>
        
        <div className="card p-6 text-center">
          <FileText className="h-8 w-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Service</h3>
          <p className="text-gray-600 mb-4">Create new service charges</p>
          <Button 
            className="w-full"
            onClick={() => setShowCreateBillModal(true)}
          >
            Add Service
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

      {/* Create Bill Modal */}
      <Modal
        isOpen={showCreateBillModal}
        onClose={() => {
          setShowCreateBillModal(false);
          resetCreateBillForm();
        }}
        title="Add Service Charge"
        size="md"
      >
        {/* Add debug info temporarily */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong><br />
            Patient ID: {billData.patient_id || 'Not set'}<br />
            Service Type: {billData.service_type}<br />
            Description: {billData.description || 'Not set'}<br />
            Unit Price: {billData.unit_price || 'Not set'}<br />
            Selected Patient: {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'None'}
          </div>
        </div>
        <form onSubmit={handleCreateBill} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient *
            </label>
            {selectedPatient ? (
  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center space-x-3">
      <User className="h-5 w-5 text-green-600" />
      <div>
        <div className="font-medium text-gray-900">
          {selectedPatient.first_name} {selectedPatient.last_name}
        </div>
        <div className="text-sm text-gray-600">
          Patient ID: {selectedPatient.patient_id || selectedPatient.id}
        </div>
        <div className="text-xs text-green-600 font-medium">
          ✓ Patient selected for billing
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={clearPatientSelection}
      className="p-1 hover:bg-green-100 rounded transition-colors"
    >
      <X className="h-5 w-5 text-gray-500" />
    </button>
  </div>
) : (
  <div className="relative">
    <Input
      placeholder="Search patient by name or ID..."
      value={patientSearch}
      onChange={(e) => setPatientSearch(e.target.value)}
      icon={<Search className="h-4 w-4" />}
    />
    {showPatientResults && patientResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {patientResults.map(patient => (
          <div
            key={patient.id}
            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
            onClick={() => {
              console.log('Clicking patient:', patient);
              handlePatientSelect(patient);
            }}
          >
            <div className="font-medium text-gray-900">
              {patient.first_name} {patient.last_name}
            </div>
            <div className="text-sm text-gray-500">
              ID: {patient.patient_id || patient.id} | 
              Phone: {patient.phone_number || 'N/A'}
            </div>
          </div>
        ))}
      </div>
    )}
    {showPatientResults && patientResults.length === 0 && patientSearch && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="text-center text-gray-500">
          No patients found for "{patientSearch}"
        </div>
      </div>
    )}
  </div>
)}
          </div>

          {/* Service Details */}
          <Select
            label="Service Type *"
            value={billData.service_type}
            onChange={(e) => setBillData(prev => ({ ...prev, service_type: e.target.value }))}
            required
          >
            {serviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <Input
            label="Description *"
            value={billData.description}
            onChange={(e) => setBillData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the service"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={billData.quantity}
              onChange={(e) => setBillData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              min="1"
            />
            <Input
              label="Unit Price ($) *"
              type="number"
              step="0.01"
              value={billData.unit_price}
              onChange={(e) => setBillData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
              placeholder="0.00"
              required
            />
          </div>

          {billData.quantity > 1 && billData.unit_price && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-lg font-semibold text-gray-900">
                ${(billData.quantity * billData.unit_price).toFixed(2)}
              </div>
            </div>
          )}

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateBillModal(false);
                resetCreateBillForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              // disabled={loading || !selectedPatient || !billData.unit_price}
            >
              {loading ? 'Adding...' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          resetPaymentForm();
        }}
        title="Process Payment"
        size="lg"
      >
        <form onSubmit={handleProcessPayment} className="space-y-6">
          {/* Step 1: Select Patient */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">1. Select Patient</h3>
            {selectedPaymentPatient ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedPaymentPatient.first_name} {selectedPaymentPatient.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {selectedPaymentPatient.patient_id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearPaymentPatientSelection}
                  className="p-1 hover:bg-green-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Search patients by name or ID..."
                  value={paymentPatientSearch}
                  onChange={(e) => setPaymentPatientSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
                {dischargedPatients.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {dischargedPatients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        onClick={() => handlePaymentPatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {patient.patient_id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {dischargedPatients.length === 0 && paymentPatientSearch && (
                  <div className="text-center py-4 text-gray-500">
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Select Bill */}
          {selectedPaymentPatient && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">2. Select Bill</h3>
              {patientBills.length > 0 ? (
                <div className="space-y-2">
                  {patientBills.map(bill => (
                    <div
                      key={bill.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBillForPayment?.id === bill.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleBillSelect(bill)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {bill.bill_number || `Service: ${bill.service_type}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: ${bill.total_amount} • 
                            {bill.balance !== undefined ? ` Balance: $${bill.balance}` : ` Paid: $${bill.amount_paid || 0}`}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {bill.service_type?.replace('_', ' ')}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.payment_status === 'Paid' || bill.balance === 0
                            ? 'bg-green-100 text-green-800'
                            : bill.payment_status === 'Partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.payment_status || (bill.balance === 0 ? 'Paid' : 'Pending')}
                        </div>
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

          {/* Step 3: Payment Details */}
          {selectedBillForPayment && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">3. Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Payment Method *"
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Amount ($) *"
                  type="number"
                  step="0.01"
                  value={paymentData.amount_paid}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount_paid: parseFloat(e.target.value) }))}
                  max={selectedBillForPayment.balance || selectedBillForPayment.total_amount}
                  required
                />
              </div>

              {paymentData.payment_method === 'insurance' && (
                <Input
                  label="Insurance Claim Number *"
                  value={paymentData.insurance_claim_number}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
                  required
                />
              )}

              <Textarea
                label="Notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Optional payment notes..."
              />

              {/* Payment Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bill Total:</span>
                    <div className="font-semibold">${selectedBillForPayment.total_amount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Balance:</span>
                    <div className="font-semibold">
                      ${selectedBillForPayment.balance || (selectedBillForPayment.total_amount - (selectedBillForPayment.amount_paid || 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Amount:</span>
                    <div className="font-semibold text-blue-600">${paymentData.amount_paid}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining Balance:</span>
                    <div className="font-semibold">
                      ${((selectedBillForPayment.balance || selectedBillForPayment.total_amount) - paymentData.amount_paid).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                resetPaymentForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedPaymentPatient || !selectedBillForPayment}
            >
              {loading ? 'Processing...' : 'Process Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Billing;