import React, { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { patientAPI, billingAPI, serviceAPI, admissionAPI } from '../../../../services/api';
import Modal from '../../../../components/ui/Modal';
import PatientSearch from '../PatientSearch';

const ChargePatientModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [currentAdmission, setCurrentAdmission] = useState(null);

  const [chargeData, setChargeData] = useState({
    patient_id: '',
    admission_id: '', // ADD THIS
    service_type: '',
    description: '',
    quantity: 1,
    unit_price: '',
    service_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  const loadServices = async () => {
    try {
      console.log('Loading services...');
      const response = await serviceAPI.getAll();
      console.log('Services API response:', response);
      
      const services = response.data?.services || 
                      response.data?.data?.services || 
                      response.data || 
                      [];
      
      console.log('Final services array:', services);
      setServices(services);
      
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    }
  };

  const loadPatientAdmission = async (patientId) => {
  try {
    console.log('🔄 Loading admission for patient:', patientId);
    const response = await admissionAPI.getAll({ 
      patient_id: patientId,
      status: 'Admitted'
    });
    
    console.log('🏥 Admissions API response:', response.data);
    
    // Extract admissions from different response structures
    let admissions = [];
    if (response.data) {
      if (Array.isArray(response.data.admissions)) {
        admissions = response.data.admissions;
      } else if (Array.isArray(response.data.data?.admissions)) {
        admissions = response.data.data.admissions;
      } else if (Array.isArray(response.data.data)) {
        admissions = response.data.data;
      }
    }
    
    console.log('📋 Extracted admissions:', admissions);
    
    const currentAdmission = admissions[0];
    console.log('🎯 Current admission:', currentAdmission);
    
    if (currentAdmission) {
      setCurrentAdmission(currentAdmission);
      setChargeData(prev => ({ 
        ...prev, 
        admission_id: currentAdmission.id 
      }));
      console.log('✅ Admission ID set to:', currentAdmission.id);
    } else {
      setCurrentAdmission(null);
      setChargeData(prev => ({ 
        ...prev, 
        admission_id: '' 
      }));
      console.log('ℹ️ No current admission found');
    }
  } catch (error) {
    console.error('💥 Error loading admission:', error);
    console.error('Error response:', error.response?.data);
    setCurrentAdmission(null);
  }
};

  const handlePatientSelect = async (patient) => {
    console.log('Patient selected:', patient);
    setSelectedPatient(patient);
    setChargeData(prev => ({ 
      ...prev, 
      patient_id: patient.id 
    }));
    
    // Load patient's current admission
    await loadPatientAdmission(patient.id);
  };

  const handleServiceSelect = (service) => {
    console.log('Selected service:', service);
    
    setSelectedService(service);
    setChargeData(prev => ({
      ...prev,
      service_type: service.service_type || service.type || '',
      description: service.description || service.service_name || service.name || '',
      unit_price: service.price || service.unit_price || service.cost || 0,
      service_id: service.id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    console.log('Submitting charge data:', chargeData);

    try {
      await billingAPI.addService(chargeData);
      alert('Service charge added successfully!');
      onClose();
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Add service error:', error.response?.data);
      setErrors({ 
        general: error.response?.data?.message || 'Failed to add service charge' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChargeData({
      patient_id: '',
      admission_id: '',
      service_type: '',
      description: '',
      quantity: 1,
      unit_price: '',
      service_id: ''
    });
    setSelectedPatient(null);
    setSelectedService(null);
    setCurrentAdmission(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Charge Patient"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <PatientSearch
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            onClearPatient={() => {
              setSelectedPatient(null);
              setCurrentAdmission(null);
              setChargeData(prev => ({ 
                ...prev, 
                patient_id: '',
                admission_id: '' 
              }));
            }}
          />
        </div>

        {/* Admission Information */}
        {currentAdmission && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <User className="h-4 w-4" />
              <div>
                <div className="font-medium">Patient is currently admitted</div>
                <div>Admission ID: {currentAdmission.id}</div>
                <div>Bed: {currentAdmission.bed?.bed_number || 'N/A'}</div>
                <div>Admitted: {new Date(currentAdmission.admission_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service *
          </label>
          <select
            value={selectedService?.id || ''}
            onChange={(e) => {
              const service = services.find(s => s.id === parseInt(e.target.value));
              if (service) handleServiceSelect(service);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.service_name} - ${service.price}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={chargeData.description}
            onChange={(e) => setChargeData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Service description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            required
          />
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={chargeData.quantity}
              onChange={(e) => setChargeData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={chargeData.unit_price}
              onChange={(e) => setChargeData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Total Amount Display */}
        {chargeData.quantity > 1 && chargeData.unit_price && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-lg font-semibold text-gray-900">
              ${(chargeData.quantity * chargeData.unit_price).toFixed(2)}
            </div>
          </div>
        )}

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{errors.general}</div>
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
            disabled={loading || !selectedPatient || !chargeData.unit_price}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Charge'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChargePatientModal;