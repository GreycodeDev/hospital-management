import React, { useState } from 'react';
import { Bed, Search, Plus, Wifi, WifiOff, Wrench } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { bedAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';

const BedManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, execute } = useApi(
    bedAPI.getAll,
    true,
    { page: currentPage, limit: 12, status: statusFilter }
  );

  const { data: availableBeds } = useApi(
    () => bedAPI.getAvailable(),
    true
  );

  const handleSearch = (e) => {
    e.preventDefault();
    execute({ page: 1, limit: 12, status: statusFilter });
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    execute({ page: 1, limit: 12, status });
    setCurrentPage(1);
  };

  const getStatusIcon = (status) => {
    const icons = {
      Available: <Wifi className="h-4 w-4 text-green-500" />,
      Occupied: <WifiOff className="h-4 w-4 text-red-500" />,
      Maintenance: <Wrench className="h-4 w-4 text-yellow-500" />,
    };
    return icons[status] || <Wifi className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800 border-green-200',
      Occupied: 'bg-red-100 text-red-800 border-red-200',
      Maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-gray-600">Manage hospital beds and occupancy</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </Button>
      </div>

      {/* Stats Overview */}
      {availableBeds?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {availableBeds.data.availableBeds?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Available Beds</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.data?.beds?.filter(bed => bed.status === 'Occupied').length || 0}
            </div>
            <div className="text-sm text-gray-600">Occupied Beds</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.data?.beds?.filter(bed => bed.status === 'Maintenance').length || 0}
            </div>
            <div className="text-sm text-gray-600">Under Maintenance</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.data?.beds?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total Beds</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search beds by number or ward..."
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
            All Beds
          </Button>
          <Button
            variant={statusFilter === 'Available' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('Available')}
          >
            Available
          </Button>
          <Button
            variant={statusFilter === 'Occupied' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('Occupied')}
          >
            Occupied
          </Button>
          <Button
            variant={statusFilter === 'Maintenance' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('Maintenance')}
          >
            Maintenance
          </Button>
        </div>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.data?.beds?.map((bed) => (
          <div key={bed.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(bed.status)}
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(bed.status)}`}>
                  {bed.status}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {bed.bed_number}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ward:</span>
                <span className="font-medium">{bed.ward.ward_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium">{bed.bed_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Rate:</span>
                <span className="font-medium">${bed.daily_rate}</span>
              </div>
              {bed.admissions && bed.admissions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-medium text-right">
                    {bed.admissions[0]?.patient?.first_name} {bed?.admissions[0]?.patient?.last_name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                View
              </Button>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.data?.beds?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Bed className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter ? 'Try adjusting your filters' : 'Get started by adding a new bed'}
          </p>
          {!statusFilter && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bed
            </Button>
          )}
        </div>
      )}

      {/* Add Bed Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Bed"
      >
        <div className="space-y-4">
          <Input label="Bed Number" placeholder="e.g., B-101" />
          <Input label="Ward" placeholder="Select ward" />
          <Input label="Daily Rate" type="number" placeholder="100.00" />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button>
              Add Bed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BedManagement;