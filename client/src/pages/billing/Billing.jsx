import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, DollarSign, FileText, Calendar, Eye, Plus, Filter, X, User } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { billingAPI, patientAPI } from '../../services/api';
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
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Patient search states for Create Bill modal
  const [billPatientSearch, setBillPatientSearch] = useState('');
  const [showBillPatientResults, setShowBillPatientResults] = useState(false);
  
  // Patient search states for Payment modal
  const [paymentPatientSearch, setPaymentPatientSearch] = useState('');
  const [showPaymentPatientResults, setShowPaymentPatientResults] = useState(false);
  const [selectedPaymentPatient, setSelectedPaymentPatient] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    patient_id: '',
    billing_id: '',
    amount: '',
    payment_method: 'cash',
    insurance_claim_number: '',
    notes: ''
  });

  const [billData, setBillData] = useState({
    patient_id: '',
    admission_id: '',
    service_type: 'consultation',
    description: '',
    quantity: 1,
    unit_price: '',
    date_of_service: new Date().toISOString().split('T')[0]
  });
  
  const { data: billingStats, loading: statsLoading, execute: refreshStats } = useApi(billingAPI.getStats);
  const { data: billsData, loading: billsLoading, execute: fetchBills } = useApi(
    () => billingAPI.getPatientBillings(filterStatus, { page: currentPage, limit: 10, search: searchTerm }),
    true
  );
  
  // Separate API calls for patient search in different modals
  const { data: billPatientResults, execute: searchBillPatients } = useApi(
    () => patientAPI.search(billPatientSearch),
    false
  );

  const { data: paymentPatientResults, execute: searchPaymentPatients } = useApi(
    () => patientAPI.search(paymentPatientSearch),
    false
  );

  // Fetch bills when filter or page changes
  useEffect(() => {
    fetchBills();
  }, [currentPage, filterStatus]);

  // Trigger patient search for Bill modal
  useEffect(() => {
    if (billPatientSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchBillPatients();
        setShowBillPatientResults(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowBillPatientResults(false);
    }
  }, [billPatientSearch]);

  // Trigger patient search for Payment modal
  useEffect(() => {
    if (paymentPatientSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchPaymentPatients();
        setShowPaymentPatientResults(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowPaymentPatientResults(false);
    }
  }, [paymentPatientSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBills();
  };

const handleCreateBill = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  try {
    await billingAPI.addService(billData);
    alert('Billing item added successfully!');
    setShowCreateBillModal(false);
    setBillData({
      patient_id: '',
      admission_id: '',
      service_type: 'consultation',
      description: '',
      quantity: 1,
      unit_price: '',
      date_of_service: new Date().toISOString().split('T')[0]
    });
    refreshStats();
    fetchBills();
  } catch (error) {
    if (error.response?.data?.errors) {
      // Handle validation errors from backend
      const validationErrors = {};
      error.response.data.errors.forEach(err => {
        validationErrors[err.field] = err.message;
      });
      setErrors(validationErrors);
    } else {
      setErrors({ 
        general: error.response?.data?.message || 'Failed to create billing item' 
      });
    }
  } finally {
    setLoading(false);
  }
};

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await billingAPI.processPayment(paymentData.billing_id, paymentData);
      alert('Payment processed successfully!');
      setShowPaymentModal(false);
      setPaymentData({
        patient_id: '',
        billing_id: '',
        amount: '',
        payment_method: 'cash',
        insurance_claim_number: '',
        notes: ''
      });
      setSelectedPaymentPatient(null);
      setPaymentPatientSearch('');
      refreshStats();
      fetchBills();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to process payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    console.log('View bill:', bill);
  };

  const handleBillPatientSelect = (patient) => {
    setSelectedPatient(patient);
    setBillData(prev => ({ ...prev, patient_id: patient.id }));
    setBillPatientSearch('');
    setShowBillPatientResults(false);
  };

  const handlePaymentPatientSelect = (patient) => {
    setSelectedPaymentPatient(patient);
    setPaymentData(prev => ({ ...prev, patient_id: patient.id }));
    setPaymentPatientSearch('');
    setShowPaymentPatientResults(false);
  };

  const clearBillPatient = () => {
    setSelectedPatient(null);
    setBillData(prev => ({ ...prev, patient_id: '' }));
    setBillPatientSearch('');
  };

  const clearPaymentPatient = () => {
    setSelectedPaymentPatient(null);
    setPaymentData(prev => ({ ...prev, patient_id: '', billing_id: '', amount: '' }));
    setPaymentPatientSearch('');
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

  const serviceTypes = [
    'consultation',
    'laboratory',
    'radiology',
    'pharmacy',
    'procedure',
    'room_charges',
    'other'
  ];

  const paymentMethods = [
    'cash',
    'credit_card',
    'debit_card',
    'insurance',
    'bank_transfer'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage patient billing and payments</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowCreateBillModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
          <Button variant="outline" onClick={() => setShowPaymentModal(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
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
                      <td className="font-medium">${bill.amount?.toLocaleString()}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bill.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : bill.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bill.status}
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
                          {bill.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setPaymentData(prev => ({
                                  ...prev,
                                  billing_id: bill.id,
                                  patient_id: bill.patient_id,
                                  amount: bill.amount
                                }));
                                setSelectedPaymentPatient({
                                  id: bill.patient_id,
                                  name: bill.patient?.name,
                                  patient_id: bill.patient?.patient_id
                                });
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
          <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-4" />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Bill</h3>
          <p className="text-gray-600 mb-4">Create bills for discharged patients</p>
          <Button 
            className="w-full"
            onClick={() => setShowCreateBillModal(true)}
          >
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

      {/* Create Bill Modal */}
      <Modal
        isOpen={showCreateBillModal}
        onClose={() => {
          setShowCreateBillModal(false);
          clearBillPatient();
        }}
        title="Create New Bill"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient *
            </label>
            
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedPatient.name}</div>
                    <div className="text-sm text-gray-600">ID: {selectedPatient.patient_id}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearBillPatient}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search patient by name or ID..."
                  value={billPatientSearch}
                  onChange={(e) => setBillPatientSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
                {showBillPatientResults && billPatientResults?.data?.patients && billPatientResults.data.patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {billPatientResults.data.patients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleBillPatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showBillPatientResults && billPatientResults?.data?.patients?.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500">
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>

          <Select
            label="Service Type"
            value={billData.service_type}
            onChange={(e) => setBillData(prev => ({ ...prev, service_type: e.target.value }))}
            required
          >
            {serviceTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
              </option>
            ))}
          </Select>

          <Input
            label="Description"
            value={billData.description}
            onChange={(e) => setBillData(prev => ({ ...prev, description: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={billData.quantity}
              onChange={(e) => setBillData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              min="1"
              required
            />

            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              value={billData.unit_price}
              onChange={(e) => setBillData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
              required
            />
          </div>

          <Input
            label="Date of Service"
            type="date"
            value={billData.date_of_service}
            onChange={(e) => setBillData(prev => ({ ...prev, date_of_service: e.target.value }))}
            required
          />

          {errors.general && (
            <div className="text-red-600 text-sm">{errors.general}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateBillModal(false);
                clearBillPatient();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPatient}>
              {loading ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Process Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          clearPaymentPatient();
        }}
        title="Process Payment"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient *
            </label>
            
            {selectedPaymentPatient ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedPaymentPatient.name}</div>
                    <div className="text-sm text-gray-600">ID: {selectedPaymentPatient.patient_id}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearPaymentPatient}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search patient by name or ID..."
                  value={paymentPatientSearch}
                  onChange={(e) => setPaymentPatientSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
                {showPaymentPatientResults && paymentPatientResults?.data?.patients && paymentPatientResults.data.patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {paymentPatientResults.data.patients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handlePaymentPatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showPaymentPatientResults && paymentPatientResults?.data?.patients?.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500">
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>

          <Select
            label="Payment Method"
            value={paymentData.payment_method}
            onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
            required
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>
                {method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_', ' ').slice(1)}
              </option>
            ))}
          </Select>

          <Input
            label="Amount ($)"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
            required
          />

          {paymentData.payment_method === 'insurance' && (
            <Input
              label="Insurance Claim Number"
              value={paymentData.insurance_claim_number}
              onChange={(e) => setPaymentData(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
              required
            />
          )}

          <Textarea
            label="Notes"
            value={paymentData.notes}
            onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />

          {errors.general && (
            <div className="text-red-600 text-sm">{errors.general}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                clearPaymentPatient();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPaymentPatient}>
              {loading ? 'Processing...' : 'Process Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Billing;