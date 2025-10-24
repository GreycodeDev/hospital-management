import React, { useState, useEffect } from 'react';
import { Bed, Search, Plus, Wifi, WifiOff, Wrench, Edit, Eye, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { bedAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';

const BedManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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

  // Fetch beds with filters and pagination
  const { data, loading: dataLoading, execute: fetchBeds } = useApi(
    () => bedAPI.getAll({
      page: currentPage,
      limit: 20,
      status: statusFilter,
      ward_id: wardFilter,
      bed_type: typeFilter,
      search: searchTerm
    }),
    false
  );

  // Fetch bed statistics
  const { data: bedStats, loading: statsLoading, execute: fetchStats } = useApi(
    bedAPI.getStats,
    true
  );

  // Fetch wards for filter dropdown
  const { data: wardsData } = useApi(
    () => bedAPI.getWards(),
    true
  );

  // Fetch beds when component mounts or filters/page changes
  useEffect(() => {
    fetchBeds();
  }, [currentPage, statusFilter, wardFilter, typeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBeds();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setWardFilter('');
    setTypeFilter('');
    setCurrentPage(1);
    setTimeout(() => fetchBeds(), 0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
      fetchBeds();
      fetchStats();
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
      fetchBeds();
      fetchStats();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to update bed' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bedId, newStatus) => {
    setLoading(true);
    try {
      await bedAPI.update(bedId, { status: newStatus });
      alert(`Bed status updated to ${newStatus}`);
      fetchBeds();
      fetchStats();
    } catch (error) {
      alert('Failed to update bed status');
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
      Occupied: <Users className="h-4 w-4 text-red-500" />,
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

  const bedTypes = ['Standard', 'ICU', 'Maternity', 'Pediatric', 'Private', 'Isolation'];
  const statusOptions = ['Available', 'Occupied', 'Maintenance'];

  const pagination = data?.data?.pagination;

  // Calculate pagination numbers
  const getPaginationNumbers = () => {
    if (!pagination) return [];
    
    const totalPages = pagination.totalPages;
    const current = pagination.currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let prev = 0;
    for (let i of range) {
      if (prev) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (i - prev !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-gray-600">Manage hospital beds and occupancy</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => { fetchBeds(); fetchStats(); }} disabled={dataLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card p-6 text-center">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bedStats?.data?.availableBeds || 0}
              </div>
              <div className="text-sm text-gray-600">Available Beds</div>
              <div className="text-xs text-green-500 mt-1">
                {bedStats?.data?.totalBeds ? 
                  `${Math.round((bedStats.data.availableBeds / bedStats.data.totalBeds) * 100)}% of total` 
                  : '0% of total'
                }
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {bedStats?.data?.occupiedBeds || 0}
              </div>
              <div className="text-sm text-gray-600">Occupied Beds</div>
              <div className="text-xs text-red-500 mt-1">
                {bedStats?.data?.occupancyRate || 0}% Occupancy
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bedStats?.data?.maintenanceBeds || 0}
              </div>
              <div className="text-sm text-gray-600">Under Maintenance</div>
              <div className="text-xs text-yellow-500 mt-1">
                {bedStats?.data?.totalBeds ? 
                  `${Math.round((bedStats.data.maintenanceBeds / bedStats.data.totalBeds) * 100)}% of total` 
                  : '0% of total'
                }
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bedStats?.data?.totalBeds || 0}
              </div>
              <div className="text-sm text-gray-600">Total Beds</div>
              <div className="text-xs text-blue-500 mt-1">
                Across all wards
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search beds by number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={dataLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters} disabled={dataLoading}>
                Clear Filters
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={dataLoading}
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>

            <Select
              label="Ward"
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              disabled={dataLoading}
            >
              <option value="">All Wards</option>
              {wardsData?.data?.wards?.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.ward_name}</option>
              ))}
            </Select>

            <Select
              label="Bed Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              disabled={dataLoading}
            >
              <option value="">All Types</option>
              {bedTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>
        </form>
      </div>

      {/* Beds Grid */}
      {dataLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data?.beds?.map((bed) => (
              <div key={bed.id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
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
                    <span className="font-medium">{bed.ward?.ward_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{bed.bed_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Rate:</span>
                    <span className="font-medium">${parseFloat(bed.daily_rate).toFixed(2)}</span>
                  </div>
                  {bed.status === 'Occupied' && bed.admissions && bed.admissions.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Patient:</span>
                      <span className="font-medium text-right text-sm">
                        {bed.admissions[0]?.patient?.first_name} {bed.admissions[0]?.patient?.last_name}
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
                    disabled={loading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditModal(bed)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Status Actions */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex space-x-1">
                    {bed.status !== 'Available' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleStatusChange(bed.id, 'Available')}
                        disabled={loading}
                      >
                        Available
                      </Button>
                    )}
                    {bed.status !== 'Occupied' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleStatusChange(bed.id, 'Occupied')}
                        disabled={loading}
                      >
                        Occupied
                      </Button>
                    )}
                    {bed.status !== 'Maintenance' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleStatusChange(bed.id, 'Maintenance')}
                        disabled={loading}
                      >
                        Maintenance
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.bedsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.bedsPerPage, pagination.totalBeds)}
                </span> of{' '}
                <span className="font-medium">{pagination.totalBeds}</span> beds
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || dataLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPaginationNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`dots-${index}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={dataLoading}
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages || dataLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!dataLoading && data?.data?.beds?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Bed className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter || wardFilter || typeFilter || searchTerm ? 
              'Try adjusting your filters or search terms' : 
              'Get started by adding a new bed'
            }
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Bed
          </Button>
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
            disabled={loading}
          />
          
          <Select
            label="Ward *"
            value={formData.ward_id}
            onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
            required
            disabled={loading}
          >
            <option value="">Select Ward</option>
            {wardsData?.data?.wards?.map(ward => (
              <option key={ward.id} value={ward.id}>{ward.ward_name}</option>
            ))}
          </Select>

          <Select
            label="Bed Type *"
            value={formData.bed_type}
            onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
            required
            disabled={loading}
          >
            {bedTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          
          <Input 
            label="Daily Rate *" 
            type="number" 
            step="0.01"
            placeholder="100.00"
            value={formData.daily_rate}
            onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
            required
            disabled={loading}
          />

          <Select
            label="Status *"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            required
            disabled={loading}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={loading}
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
            disabled={loading}
          />
          
          <Select
            label="Bed Type *"
            value={formData.bed_type}
            onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
            required
            disabled={loading}
          >
            {bedTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          
          <Input 
            label="Daily Rate *" 
            type="number" 
            step="0.01"
            placeholder="100.00"
            value={formData.daily_rate}
            onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
            required
            disabled={loading}
          />

          <Select
            label="Status *"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            required
            disabled={loading}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
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
                    {getStatusIcon(selectedBed.status)}
                    <span className="ml-1">{selectedBed.status}</span>
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
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedBed.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedBed.status === 'Occupied' && selectedBed.admissions && selectedBed.admissions.length > 0 && (
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
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Doctor</span>
                      <span className="text-sm text-gray-900">{admission.assigned_doctor}</span>
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