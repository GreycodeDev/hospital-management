import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, User, Bed } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { admissionAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const Admissions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, execute } = useApi(
    admissionAPI.getAll,
    true,
    { page: currentPage, limit: 10, search: searchTerm, status: statusFilter }
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admissions</h1>
          <p className="text-gray-600">Manage patient admissions and discharges</p>
        </div>
        <Link to="/admissions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Admission
          </Button>
        </Link>
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
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {admission.patient.first_name} {admission.patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {admission.patient.patient_id}
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
                      {admission.bed.bed_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {admission.bed.ward.ward_name}
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
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      {admission.status === 'Admitted' && (
                        <Button variant="danger" size="sm">
                          Discharge
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {data?.data?.admissions?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bed className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No admissions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Try adjusting your search filters' : 'Get started by admitting a patient'}
            </p>
            {!searchTerm && !statusFilter && (
              <Link to="/admissions/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Admission
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
      </div>
    </div>
  );
};

export default Admissions;