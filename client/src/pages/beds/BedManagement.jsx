import React, { useState } from 'react';
import { Bed, Search, Plus, Wifi, WifiOff, Wrench, Edit, Eye, X } from 'lucide-react';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    bed_number: '',
    ward_id: '',
    daily_rate: '',
    bed_type: 'Standard',
    status: 'Available'
  });

  const { data, loading: dataLoading, execute } = useApi(
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

  const handleAddBed = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await bedAPI.create(formData);
      alert('Bed added successfully!');
      setShowAddModal(false);
      setFormData({
        bed_number: '',
        ward_id: '',
        daily_rate: '',
        bed_type: 'Standard',
        status: 'Available'
      });
      execute({ page: currentPage, limit: 12, status: statusFilter });
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to add bed' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBed = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await bedAPI.update(selectedBed.id, formData);
      alert('Bed updated successfully!');
      setShowEditModal(false);
      setSelectedBed(null);
      execute({ page: currentPage, limit: 12, status: statusFilter });
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to update bed' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (bed) => {
    setSelectedBed(bed);
    setFormData({
      bed_number: bed.bed_number,
      ward_id: bed.ward_id,
      daily_rate: bed.daily_rate,
      bed_type: bed.bed_type,
      status: bed.status
    });
    setShowEditModal(true);
  };

  const openViewModal = async (bed) => {
    setLoading(true);
    try {
      const response = await bedAPI.getById(bed.id);
      setSelectedBed(response.data.data.bed);
      setShowViewModal(true);
    } catch (error) {
      alert('Failed to load bed details');
    } finally {
      setLoading(false);
    }
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
        <Button onClick={() => {
          setFormData({
            bed_number: '',
            ward_id: '',
            daily_rate: '',
            bed_type: 'Standard',
            status: 'Available'
          });
          setShowAddModal(true);
        }}>
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
      {dataLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : (
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openViewModal(bed)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditModal(bed)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        </div>
      )}

      {/* Add Bed Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Bed"
      >
        <form onSubmit={handleAddBed} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}
          
          <Input 
            label="Bed Number *" 
            placeholder="e.g., B-101"
            value={formData.bed_number}
            onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
            <select
              className="input"
              value={formData.ward_id}
              onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
              required
            >
              <option value="">Select Ward</option>
              <option value="1">General Ward A</option>
              <option value="2">General Ward B</option>
              <option value="3">ICU</option>
              <option value="4">Maternity Ward</option>
              <option value="5">Pediatric Ward</option>
              <option value="6">Surgical Ward</option>
              <option value="7">Orthopedic Ward</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
            <select
              className="input"
              value={formData.bed_type}
              onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
              required
            >
              <option value="Standard">Standard</option>
              <option value="ICU">ICU</option>
              <option value="Maternity">Maternity</option>
              <option value="Pediatric">Pediatric</option>
              <option value="Private">Private</option>
            </select>
          </div>
          
          <Input 
            label="Daily Rate *" 
            type="number" 
            step="0.01"
            placeholder="100.00"
            value={formData.daily_rate}
            onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              required
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Bed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Bed"
      >
        <form onSubmit={handleEditBed} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}
          
          <Input 
            label="Bed Number *" 
            placeholder="e.g., B-101"
            value={formData.bed_number}
            onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
            <select
              className="input"
              value={formData.bed_type}
              onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
              required
            >
              <option value="Standard">Standard</option>
              <option value="ICU">ICU</option>
              <option value="Maternity">Maternity</option>
              <option value="Pediatric">Pediatric</option>
              <option value="Private">Private</option>
            </select>
          </div>
          
          <Input 
            label="Daily Rate *" 
            type="number" 
            step="0.01"
            placeholder="100.00"
            value={formData.daily_rate}
            onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              required
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Update Bed
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Bed Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Bed Details"
        size="lg"
      >
        {selectedBed && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Bed Number</label>
                <p className="text-lg font-semibold text-gray-900">{selectedBed.bed_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBed.status)}`}>
                    {selectedBed.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ward</label>
                <p className="text-gray-900">{selectedBed.ward?.ward_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bed Type</label>
                <p className="text-gray-900">{selectedBed.bed_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Daily Rate</label>
                <p className="text-gray-900">${parseFloat(selectedBed.daily_rate).toFixed(2)}</p>
              </div>
            </div>

            {selectedBed.admissions && selectedBed.admissions.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Admission</h3>
                {selectedBed.admissions.map(admission => (
                  <div key={admission.id} className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Patient</span>
                      <span className="text-sm text-gray-900">
                        {admission.patient?.first_name} {admission.patient?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Admitted</span>
                      <span className="text-sm text-gray-900">
                        {new Date(admission.admission_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Reason</span>
                      <span className="text-sm text-gray-900">{admission.reason_for_admission}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BedManagement;