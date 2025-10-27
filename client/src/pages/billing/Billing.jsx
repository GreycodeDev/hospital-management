import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { billingAPI } from '../../services/api';
import BillingStats from './components/BillingStats';
import BillingTable from './components/BillingTable';
import QuickActions from './components/QuickActions';
import ChargePatientModal from './components/modals/ChargePatientModal';
import ProcessPaymentModal from './components/modals/ProcessPaymentModal';
import GenerateFinalBillModal from './components/modals/GenerateFinalBillModal';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showChargePatientModal, setShowChargePatientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showFinalBillModal, setShowFinalBillModal] = useState(false);
  
  const { data: billingStats, loading: statsLoading, execute: refreshStats } = useApi(billingAPI.getStats);
  const { data: billsData, loading: billsLoading, execute: fetchBills } = useApi(
    () => billingAPI.getAllBills(filterStatus, { page: currentPage, limit: 10, search: searchTerm }),
    true
  );

  useEffect(() => {
    fetchBills();
  }, [currentPage, filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBills();
  };

  const refreshData = () => {
    refreshStats();
    fetchBills();
  };

  const handleFinalBillSuccess = (generatedBill) => {
  // Open payment modal with the generated bill
  setSelectedBillForPayment(generatedBill);
  setShowPaymentModal(true);
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage patient billing and payments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <BillingStats stats={billingStats?.data} loading={statsLoading} />

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <form onSubmit={handleSearch} className="flex space-x-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search bills by patient name or bill number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <BillingTable 
        billsData={billsData}
        loading={billsLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onProcessPayment={(bill) => {
          // Handle payment processing
          setShowPaymentModal(true);
        }}
      />

      {/* Quick Actions */}
      <QuickActions 
        onChargePatient={() => setShowChargePatientModal(true)}
        onProcessPayment={() => setShowPaymentModal(true)}
        onGenerateFinalBill={() => setShowFinalBillModal(true)}
      />

      {/* Modals */}
      <ChargePatientModal
        isOpen={showChargePatientModal}
        onClose={() => setShowChargePatientModal(false)}
        onSuccess={refreshData}
      />


      <GenerateFinalBillModal
        isOpen={showFinalBillModal}
        onClose={() => setShowFinalBillModal(false)}
        onSuccess={handleFinalBillSuccess}
      />

      <ProcessPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={refreshData}
        preSelectedBill={selectedBillForPayment}
      />
    </div>
  );
};

export default Billing;