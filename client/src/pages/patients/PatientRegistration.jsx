import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { patientAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    address: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    blood_type: '',
    allergies: '',
    emergency_contact: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await patientAPI.register(formData);
      
      if (response.data.success) {
        alert('Patient registered successfully!');
        navigate('/patients');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Register New Patient</h1>
            <p className="text-gray-600">Add a new patient to the system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6">
        {errors.general && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          </div>
          
          <Input
            label="First Name *"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            placeholder="Enter first name"
          />
          
          <Input
            label="Last Name *"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            placeholder="Enter last name"
          />
          
          <Input
            label="ID Number *"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            error={errors.id_number}
            placeholder="Enter national ID number"
          />
          
          <Input
            label="Date of Birth *"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`input ${errors.gender ? 'border-red-500' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>
          
          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            error={errors.phone_number}
            placeholder="Enter phone number"
          />

          {/* Contact Information */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          </div>
          
          <div className="md:col-span-2">
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              placeholder="Enter full address"
            />
          </div>

          {/* Next of Kin */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Next of Kin</h3>
          </div>
          
          <Input
            label="Next of Kin Name"
            name="next_of_kin_name"
            value={formData.next_of_kin_name}
            onChange={handleChange}
            error={errors.next_of_kin_name}
            placeholder="Enter next of kin name"
          />
          
          <Input
            label="Next of Kin Phone"
            name="next_of_kin_phone"
            value={formData.next_of_kin_phone}
            onChange={handleChange}
            error={errors.next_of_kin_phone}
            placeholder="Enter next of kin phone"
          />

          {/* Medical Information */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
            <select
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          
          <Input
            label="Emergency Contact"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            error={errors.emergency_contact}
            placeholder="Enter emergency contact"
          />
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="List any known allergies"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/patients')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Register Patient
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;