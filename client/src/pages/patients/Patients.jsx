import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { patientAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, error, execute } = useApi(
    patientAPI.getAll,
    true,
    { page: currentPage, limit: 10, search: searchTerm }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    execute({ page: 1, limit: 10, search: searchTerm });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    execute({ page, limit: 10, search: searchTerm });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage patient records and information</p>
        </div>
        <Link to="/patients/register">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Patient
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search patients by name, ID, or patient number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>ID Number</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.patients?.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="font-mono text-sm">{patient.patient_id}</td>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td>{patient.id_number}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.gender === 'Male' 
                        ? 'bg-blue-100 text-blue-800'
                        : patient.gender === 'Female'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.gender}
                    </span>
                  </td>
                  <td>{patient.phone_number || 'N/A'}</td>
                  <td>
                    <div className="flex space-x-2">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {data?.data?.patients?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by registering a new patient'}
            </p>
            {!searchTerm && (
              <Link to="/patients/register">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Patient
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((data.data.pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(data.data.pagination.currentPage * 10, data.data.pagination.totalPatients)} of{' '}
                {data.data.pagination.totalPatients} patients
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
      </div>
    </div>
  );
};

export default Patients;