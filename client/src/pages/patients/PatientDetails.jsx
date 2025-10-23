import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Users, Activity } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { patientAPI } from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';

const PatientDetails = () => {
  const { id } = useParams();
  const { data, loading, error } = useApi(() => patientAPI.getById(id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !data?.data?.patient) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <User className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Patient not found</h3>
        <p className="text-gray-600 mb-4">The patient you're looking for doesn't exist.</p>
        <Link to="/patients">
          <Button variant="primary">
            Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  const patient = data.data.patient;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/patients"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">Patient ID: {patient.patient_id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Patient ID</label>
                <p className="font-mono text-gray-900">{patient.patient_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID Number</label>
                <p className="text-gray-900">{patient.id_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">
                  {new Date(patient.date_of_birth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <p className="text-gray-900">{patient.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Blood Type</label>
                <p className="text-gray-900">{patient.blood_type || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                </div>
                <p className="text-gray-900">{patient.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-500">Address</label>
                </div>
                <p className="text-gray-900">{patient.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Allergies</label>
                <p className="text-gray-900 mt-1">
                  {patient.allergies || 'No known allergies'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                <p className="text-gray-900 mt-1">
                  {patient.emergency_contact || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next of Kin */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Next of Kin
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{patient.next_of_kin_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{patient.next_of_kin_phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Visit History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Visit History
            </h2>
            {patient.visits && patient.visits.length > 0 ? (
              <div className="space-y-3">
                {patient.visits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="border-l-4 border-primary-500 pl-3">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {visit.symptoms ? visit.symptoms.substring(0, 50) + '...' : 'No symptoms recorded'}
                    </p>
                  </div>
                ))}
                {patient.visits.length > 3 && (
                  <p className="text-sm text-primary-600 text-center">
                    +{patient.visits.length - 3} more visits
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No visit history</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to={`/admissions/new?patientId=${patient.id}`}
                className="block w-full text-center btn btn-primary"
              >
                Admit Patient
              </Link>
              <Link
                to={`/billing?patientId=${patient.id}`}
                className="block w-full text-center btn btn-secondary"
              >
                View Billing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;