import React, { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { patientAPI } from '../../../services/api';

const PatientSearch = ({ selectedPatient, onPatientSelect, onClearPatient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchPatients(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setError('');
    }
  }, [searchQuery]);

const searchPatients = async (query) => {
  try {
    setLoading(true);
    console.log('🔍 Searching patients with query:', query);
    
    let response;
    try {
      console.log('Trying search endpoint...');
      response = await patientAPI.search(query);
      console.log('✅ Search API response:', response.data);
    } catch (searchError) {
      console.log('❌ Search API failed, trying getAll:', searchError);
      response = await patientAPI.getAll({ search: query });
      console.log('✅ GetAll API response:', response.data);
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
        patients = Object.values(response.data.patients);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        patients = response.data.data;
      }
    }
    
    console.log('📋 Final patients array:', patients);
    console.log('📊 Number of patients found:', patients.length);
    setSearchResults(patients);
    setShowResults(true);
    
  } catch (error) {
    console.error('💥 Error searching patients:', error);
    console.error('Error details:', error.response?.data);
    setSearchResults([]);
  } finally {
    setLoading(false);
  }
};

  const handlePatientSelect = (patient) => {
    console.log('👤 Patient selected:', patient);
    onPatientSelect(patient);
    setSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setShowResults(false);
    setError('');
  };

  const handleClear = () => {
    console.log('🧹 Clearing patient selection');
    setSearchQuery('');
    setError('');
    onClearPatient();
  };

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-gray-900">
              {selectedPatient.first_name} {selectedPatient.last_name}
            </div>
            <div className="text-sm text-gray-600">
              ID: {selectedPatient.patient_id || selectedPatient.id}
            </div>
            <div className="text-xs text-green-600 font-medium">
              ✓ Patient selected
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:bg-green-100 rounded transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search patient by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map(patient => (
            <div
              key={patient.id}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handlePatientSelect(patient)}
            >
              <div className="font-medium text-gray-900">
                {patient.first_name} {patient.last_name}
              </div>
              <div className="text-sm text-gray-600">
                ID: {patient.patient_id || patient.id}
              </div>
              <div className="text-xs text-gray-500">
                Phone: {patient.phone_number || 'N/A'} | 
                Gender: {patient.gender || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No Results Message */}
      {showResults && searchResults.length === 0 && searchQuery && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center">
            <div className="text-gray-500 mb-2">
              {error || `No patients found for "${searchQuery}"`}
            </div>
            <div className="text-xs text-gray-400">
              Try searching by first name, last name, or patient ID
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;