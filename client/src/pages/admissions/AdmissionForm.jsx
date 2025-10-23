import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, User, Bed, Stethoscope } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { admissionAPI, patientAPI, bedAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showBedSearch, setShowBedSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [bedSearchTerm, setBedSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    patient_id: '',
    bed_id: '',
    visit_id: '',
    expected_stay_days: '',
    reason_for_admission: '',
    attending_physician: '',
    insurance_info: ''
  });

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  // APIs
  const { data: patientSearchResults, execute: searchPatients } = useApi(
    () => patientAPI.search(patientSearchTerm),
    false
  );

  const { data: availableBeds, execute: searchBeds } = useApi(
    () => bedAPI.getAvailable(),
    true
  );

  // Pre-fill patient if patientId is in URL
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId) {
      // Fetch patient details and pre-fill
      patientAPI.getById(patientId).then(response => {
        const patient = response.data.data.patient;
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patient_id: patient.id }));
      });
    }
  }, [searchParams]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_id: patient.id }));
    setShowPatientSearch(false);
    setPatientSearchTerm('');
  };

  const handleBedSelect = (bed) => {
    setSelectedBed(bed);
    setFormData(prev => ({ ...prev, bed_id: bed.id }));
    setShowBedSearch(false);
    setBedSearchTerm('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patient_id) newErrors.patient_id = 'Patient is required';
    if (!formData.bed_id) newErrors.bed_id = 'Bed is required';
    if (!formData.reason_for_admission) newErrors.reason_for_admission = 'Reason for admission is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await admissionAPI.admitPatient(formData);
      
      if (response.data.success) {
        alert('Patient admitted successfully!');
        navigate('/admissions');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Admission failed';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const filteredBeds = availableBeds?.data?.availableBeds?.filter(bed => 
    bed.bed_number.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
    bed.ward.ward_name.toLowerCase().includes(bedSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admissions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admit Patient</h1>
            <p className="text-gray-600">Admit a patient to the hospital</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6">
        {errors.general && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h3>
            
            {selectedPatient ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      ID: {selectedPatient.patient_id} | {selectedPatient.gender} | {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {selectedPatient.phone_number || 'N/A'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setFormData(prev => ({ ...prev, patient_id: '' }));
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPatientSearch(true)}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Select Patient
                </Button>
                {errors.patient_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
                )}
              </div>
            )}
          </div>

          {/* Bed Selection */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bed className="h-5 w-5 mr-2" />
              Bed Assignment
            </h3>
            
            {selectedBed ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Bed {selectedBed.bed_number}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ward: {selectedBed.ward.ward_name} | Type: {selectedBed.bed_type}
                    </p>
                    <p className="text-sm text-gray-600">
                      Daily Rate: ${selectedBed.daily_rate}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBed(null);
                      setFormData(prev => ({ ...prev, bed_id: '' }));
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBedSearch(true)}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Select Bed
                </Button>
                {errors.bed_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.bed_id}</p>
                )}
              </div>
            )}
          </div>

          {/* Admission Details */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2" />
              Admission Details
            </h3>
          </div>

          <Input
            label="Expected Stay (Days)"
            name="expected_stay_days"
            type="number"
            value={formData.expected_stay_days}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              expected_stay_days: e.target.value
            }))}
            placeholder="e.g., 5"
          />

          <Input
            label="Attending Physician"
            name="attending_physician"
            value={formData.attending_physician}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              attending_physician: e.target.value
            }))}
            placeholder="Enter physician name"
          />

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Admission *
            </label>
            <textarea
              name="reason_for_admission"
              value={formData.reason_for_admission}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reason_for_admission: e.target.value
              }))}
              rows={4}
              className={`input ${errors.reason_for_admission ? 'border-red-500' : ''}`}
              placeholder="Describe the reason for admission..."
              required
            />
            {errors.reason_for_admission && (
              <p className="mt-1 text-sm text-red-600">{errors.reason_for_admission}</p>
            )}
          </div>

          <div className="lg:col-span-2">
            <Input
              label="Insurance Information"
              name="insurance_info"
              value={formData.insurance_info}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                insurance_info: e.target.value
              }))}
              placeholder="Enter insurance details if applicable"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admissions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !selectedPatient || !selectedBed}
          >
            Admit Patient
          </Button>
        </div>
      </form>

      {/* Patient Search Modal */}
      <Modal
        isOpen={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        title="Select Patient"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search patients by name or ID..."
            value={patientSearchTerm}
            onChange={(e) => setPatientSearchTerm(e.target.value)}
          />
          
          <Button
            onClick={() => searchPatients(patientSearchTerm)}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            Search Patients
          </Button>

          <div className="max-h-96 overflow-y-auto">
            {patientSearchResults?.data?.patients?.map((patient) => (
              <div
                key={patient.id}
                className="border border-gray-200 rounded-lg p-4 mb-3 hover:border-primary-300 cursor-pointer"
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="font-medium text-gray-900">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-gray-600">
                  ID: {patient.patient_id} | {patient.gender} | {new Date(patient.date_of_birth).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  Phone: {patient.phone_number || 'N/A'}
                </div>
              </div>
            ))}
            
            {patientSearchResults?.data?.patients?.length === 0 && patientSearchTerm && (
              <p className="text-center text-gray-500 py-4">No patients found</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Bed Search Modal */}
      <Modal
        isOpen={showBedSearch}
        onClose={() => setShowBedSearch(false)}
        title="Select Available Bed"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search beds by number or ward..."
            value={bedSearchTerm}
            onChange={(e) => setBedSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            {filteredBeds?.map((bed) => (
              <div
                key={bed.id}
                className="border border-gray-200 rounded-lg p-4 mb-3 hover:border-primary-300 cursor-pointer"
                onClick={() => handleBedSelect(bed)}
              >
                <div className="font-medium text-gray-900">
                  Bed {bed.bed_number}
                </div>
                <div className="text-sm text-gray-600">
                  Ward: {bed.ward.ward_name} | Type: {bed.bed_type}
                </div>
                <div className="text-sm text-gray-600">
                  Daily Rate: ${bed.daily_rate} | Gender: {bed.ward.gender_specific}
                </div>
              </div>
            ))}
            
            {filteredBeds?.length === 0 && (
              <p className="text-center text-gray-500 py-4">No available beds found</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdmissionForm;