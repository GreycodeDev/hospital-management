import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, User, Bed, X, AlertCircle, FileText, Clock, Activity } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { admissionAPI, patientAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

const Admissions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Patient search for new admission
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Admission form data
  const [admissionData, setAdmissionData] = useState({
    patient_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    admission_type: 'emergency',
    department: '',
    ward_id: '',
    bed_id: '',
    attending_physician: '',
    chief_complaint: '',
    diagnosis: '',
    medical_history: '',
    allergies: '',
    emergency_contact: '',
    insurance_info: ''
  });

  // Discharge form data
  const [dischargeData, setDischargeData] = useState({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_type: 'routine',
    discharge_summary: '',
    discharge_instructions: '',
    follow_up_date: '',
    medications: '',
    final_diagnosis: ''
  });
  
  const { data, loading: dataLoading, execute } = useApi(
    admissionAPI.getAll,
    true,
    { page: currentPage, limit: 10, search: searchTerm, status: statusFilter }
  );

  const { data: patientResults, execute: searchPatients } = useApi(
    () => patientAPI.search(patientSearch),
    false
  );

  const { data: statsData, execute: fetchStats } = useApi(admissionAPI.getStats, true);

  // Trigger patient search
  useEffect(() => {
    if (patientSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchPatients();
        setShowPatientResults(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowPatientResults(false);
    }
  }, [patientSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    execute({ page: 1, limit: 10, search: searchTerm, status: statusFilter });
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    execute({ page: 1, limit: 10, search: searchTerm, status });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    execute({ page, limit: 10, search: searchTerm, status: statusFilter });
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setAdmissionData(prev => ({ ...prev, patient_id: patient.id }));
    setPatientSearch('');
    setShowPatientResults(false);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setAdmissionData(prev => ({ ...prev, patient_id: '' }));
    setPatientSearch('');
  };

  const handleNewAdmission = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await admissionAPI.create(admissionData);
      alert('Patient admitted successfully!');
      setShowNewAdmissionModal(false);
      resetAdmissionForm();
      execute({ page: currentPage, limit: 10, search: searchTerm, status: statusFilter });
      fetchStats();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to admit patient' });
    } finally {
      setLoading(false);
    }
  };

const handleDischarge = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  console.log('Starting discharge process...');
  console.log('Selected admission:', selectedAdmission);
  console.log('Discharge data:', dischargeData);

  try {
    const dischargePayload = {
      discharge_notes: dischargeData.discharge_summary,
      discharge_summary: dischargeData.discharge_summary,
      discharge_instructions: dischargeData.discharge_instructions,
      follow_up_date: dischargeData.follow_up_date || null,
      medications: dischargeData.medications,
      final_diagnosis: dischargeData.final_diagnosis,
      discharge_type: dischargeData.discharge_type
    };

    console.log('Sending discharge payload:', dischargePayload);

    const response = await admissionAPI.dischargePatient(selectedAdmission.id, dischargePayload);
    console.log('Discharge API response:', response);

    alert('Patient discharged successfully!');
    setShowDischargeModal(false);
    setSelectedAdmission(null);
    resetDischargeForm();
    
    // Refresh data
    execute({ page: currentPage, limit: 10, search: searchTerm, status: statusFilter });
    fetchStats();
    
  } catch (error) {
    console.error('Discharge error details:', error);
    console.error('Error response:', error.response);
    
    let errorMessage = 'Failed to discharge patient. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something else happened
      errorMessage = error.message || 'An unexpected error occurred.';
    }
    
    setErrors({ general: errorMessage });
    
  } finally {
    setLoading(false);
  }
};

  const handleView = (admission) => {
    setSelectedAdmission(admission);
    setShowViewModal(true);
  };

  const handleDischargeClick = (admission) => {
    setSelectedAdmission(admission);
    setDischargeData(prev => ({
      ...prev,
      final_diagnosis: admission.diagnosis || ''
    }));
    setShowDischargeModal(true);
  };

  const resetAdmissionForm = () => {
    setAdmissionData({
      patient_id: '',
      admission_date: new Date().toISOString().split('T')[0],
      admission_type: 'emergency',
      department: '',
      ward_id: '',
      bed_id: '',
      attending_physician: '',
      chief_complaint: '',
      diagnosis: '',
      medical_history: '',
      allergies: '',
      emergency_contact: '',
      insurance_info: ''
    });
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const resetDischargeForm = () => {
    setDischargeData({
      discharge_date: new Date().toISOString().split('T')[0],
      discharge_type: 'routine',
      discharge_summary: '',
      discharge_instructions: '',
      follow_up_date: '',
      medications: '',
      final_diagnosis: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Admitted: 'bg-green-100 text-green-800',
      Discharged: 'bg-gray-100 text-gray-800',
      Transferred: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  const admissionTypes = ['emergency', 'elective', 'referral', 'routine'];
  const dischargeTypes = ['routine', 'transfer', 'against_medical_advice', 'deceased'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admissions</h1>
          <p className="text-gray-600">Manage patient admissions and discharges</p>
        </div>
        <Button onClick={() => setShowNewAdmissionModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Admission
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Bed className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Admissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.data?.currentAdmissions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Admissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.data?.todayAdmissions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Discharges</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.data?.todayDischarges || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bed Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.data?.bedOccupancy || '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
        
        <div className="flex space-x-2">
          <Button
            variant={statusFilter === '' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'Admitted' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('Admitted')}
          >
            Current
          </Button>
          <Button
            variant={statusFilter === 'Discharged' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('Discharged')}
          >
            Discharged
          </Button>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Patient Admissions</h2>
        </div>

        {dataLoading ? (
          <div className="flex justify-center p-8">
            <Loader />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Admission Date</th>
                    <th>Bed/Ward</th>
                    <th>Status</th>
                    <th>Attending Physician</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.admissions?.map((admission) => (
                    <tr key={admission.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {admission.patient?.first_name} {admission.patient?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {admission.patient?.patient_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(admission.admission_date).toLocaleDateString()}
                        </div>
                        {admission.discharge_date && (
                          <div className="text-sm text-gray-500">
                            Discharged: {new Date(admission.discharge_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center text-sm text-gray-900">
                          <Bed className="h-4 w-4 mr-2 text-gray-400" />
                          {admission.bed?.bed_number || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {admission.bed?.ward?.ward_name || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(admission.status)}
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {admission.attending_physician || 'Not assigned'}
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleView(admission)}
                          >
                            View
                          </Button>
                          {admission.status === 'Admitted' && (
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleDischargeClick(admission)}
                            >
                              Discharge
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {(!data?.data?.admissions || data.data.admissions.length === 0) && (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <Bed className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No admissions found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || statusFilter ? 'Try adjusting your search filters' : 'Get started by admitting a patient'}
                        </p>
                        {!searchTerm && !statusFilter && (
                          <Button onClick={() => setShowNewAdmissionModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Admission
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((data.data.pagination.currentPage - 1) * 10) + 1} to{' '}
                    {Math.min(data.data.pagination.currentPage * 10, data.data.pagination.totalAdmissions)} of{' '}
                    {data.data.pagination.totalAdmissions} admissions
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.data.pagination.currentPage === 1}
                      onClick={() => handlePageChange(data.data.pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.data.pagination.currentPage === data.data.pagination.totalPages}
                      onClick={() => handlePageChange(data.data.pagination.currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Admission Modal */}
      <Modal
        isOpen={showNewAdmissionModal}
        onClose={() => {
          setShowNewAdmissionModal(false);
          resetAdmissionForm();
        }}
        title="New Patient Admission"
        size="large"
      >
        <form onSubmit={handleNewAdmission} className="space-y-4">
          {/* Patient Selection */}
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
                    <div className="font-medium text-gray-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                    <div className="text-sm text-gray-600">ID: {selectedPatient.patient_id}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearPatientSelection}
                  className="p-1 hover:bg-blue-100 rounded"
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
                {showPatientResults && patientResults?.data?.patients && patientResults.data.patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {patientResults.data.patients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Admission Date"
              type="date"
              value={admissionData.admission_date}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, admission_date: e.target.value }))}
              required
            />

            <Select
              label="Admission Type"
              value={admissionData.admission_type}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, admission_type: e.target.value }))}
              required
            >
              {admissionTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              value={admissionData.department}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, department: e.target.value }))}
              required
            />

            <Input
              label="Attending Physician"
              value={admissionData.attending_physician}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, attending_physician: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Chief Complaint"
            value={admissionData.chief_complaint}
            onChange={(e) => setAdmissionData(prev => ({ ...prev, chief_complaint: e.target.value }))}
            required
          />

          <Textarea
            label="Diagnosis"
            value={admissionData.diagnosis}
            onChange={(e) => setAdmissionData(prev => ({ ...prev, diagnosis: e.target.value }))}
            rows={3}
          />

          <Textarea
            label="Medical History"
            value={admissionData.medical_history}
            onChange={(e) => setAdmissionData(prev => ({ ...prev, medical_history: e.target.value }))}
            rows={3}
          />

          <Input
            label="Allergies"
            value={admissionData.allergies}
            onChange={(e) => setAdmissionData(prev => ({ ...prev, allergies: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Emergency Contact"
              value={admissionData.emergency_contact}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, emergency_contact: e.target.value }))}
            />

            <Input
              label="Insurance Info"
              value={admissionData.insurance_info}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, insurance_info: e.target.value }))}
            />
          </div>

          {errors.general && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{errors.general}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewAdmissionModal(false);
                resetAdmissionForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPatient}>
              {loading ? 'Admitting...' : 'Admit Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal
        isOpen={showDischargeModal}
        onClose={() => {
          setShowDischargeModal(false);
          setSelectedAdmission(null);
          resetDischargeForm();
        }}
        title="Discharge Patient"
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          {selectedAdmission && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {selectedAdmission.patient?.patient_id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Admitted: {new Date(selectedAdmission.admission_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Discharge Date"
              type="date"
              value={dischargeData.discharge_date}
              onChange={(e) => setDischargeData(prev => ({ ...prev, discharge_date: e.target.value }))}
              required
            />

            <Select
              label="Discharge Type"
              value={dischargeData.discharge_type}
              onChange={(e) => setDischargeData(prev => ({ ...prev, discharge_type: e.target.value }))}
              required
            >
              {dischargeTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Discharge Summary"
            value={dischargeData.discharge_summary}
            onChange={(e) => setDischargeData(prev => ({ ...prev, discharge_summary: e.target.value }))}
            rows={4}
            required
          />

          <Textarea
            label="Discharge Instructions"
            value={dischargeData.discharge_instructions}
            onChange={(e) => setDischargeData(prev => ({ ...prev, discharge_instructions: e.target.value }))}
            rows={3}
            required
          />

          <Input
            label="Final Diagnosis"
            value={dischargeData.final_diagnosis}
            onChange={(e) => setDischargeData(prev => ({ ...prev, final_diagnosis: e.target.value }))}
            required
          />

          <Textarea
            label="Medications"
            value={dischargeData.medications}
            onChange={(e) => setDischargeData(prev => ({ ...prev, medications: e.target.value }))}
            rows={3}
            placeholder="List all prescribed medications..."
          />

          <Input
            label="Follow-up Date"
            type="date"
            value={dischargeData.follow_up_date}
            onChange={(e) => setDischargeData(prev => ({ ...prev, follow_up_date: e.target.value }))}
          />

          {errors.general && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{errors.general}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDischargeModal(false);
                setSelectedAdmission(null);
                resetDischargeForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={loading}>
              {loading ? 'Processing...' : 'Discharge Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Admission Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAdmission(null);
        }}
        title="Admission Details"
        size="large"
      >
        {selectedAdmission && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">
                    {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient ID</label>
                  <p className="text-gray-900">{selectedAdmission.patient?.patient_id}</p>
                </div>
              </div>
            </div>

            {/* Admission Info */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Admission Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Admission Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedAdmission.admission_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAdmission.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Bed Number</label>
                  <p className="text-gray-900">{selectedAdmission.bed?.bed_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ward</label>
                  <p className="text-gray-900">{selectedAdmission.bed?.ward?.ward_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Attending Physician</label>
                  <p className="text-gray-900">{selectedAdmission.attending_physician || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900">{selectedAdmission.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                  <p className="text-gray-900">{selectedAdmission.chief_complaint || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                  <p className="text-gray-900">{selectedAdmission.diagnosis || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Medical History</label>
                  <p className="text-gray-900">{selectedAdmission.medical_history || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Allergies</label>
                  <p className="text-gray-900">{selectedAdmission.allergies || 'None reported'}</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <p className="text-gray-900">{selectedAdmission.emergency_contact || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Insurance Info</label>
                  <p className="text-gray-900">{selectedAdmission.insurance_info || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Discharge Info (if discharged) */}
            {selectedAdmission.status === 'Discharged' && selectedAdmission.discharge_date && (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Discharge Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Discharge Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedAdmission.discharge_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Discharge Type</label>
                      <p className="text-gray-900 capitalize">
                        {selectedAdmission.discharge_type?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Final Diagnosis</label>
                    <p className="text-gray-900">{selectedAdmission.final_diagnosis || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Discharge Summary</label>
                    <p className="text-gray-900">{selectedAdmission.discharge_summary || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Discharge Instructions</label>
                    <p className="text-gray-900">{selectedAdmission.discharge_instructions || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Medications</label>
                    <p className="text-gray-900">{selectedAdmission.medications || 'N/A'}</p>
                  </div>
                  {selectedAdmission.follow_up_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Follow-up Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedAdmission.follow_up_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div className="flex space-x-3">
                {selectedAdmission.status === 'Admitted' && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowViewModal(false);
                      handleDischargeClick(selectedAdmission);
                    }}
                  >
                    Discharge Patient
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedAdmission(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admissions;