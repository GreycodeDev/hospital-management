import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Shield, Mail } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { userAPI } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, execute } = useApi(
    userAPI.getAll,
    true,
    { page: currentPage, limit: 10, search: searchTerm }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    execute({ page: 1, limit: 10, search: searchTerm });
    setCurrentPage(1);
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: 'bg-purple-100 text-purple-800',
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-green-100 text-green-800',
      billing_clerk: 'bg-yellow-100 text-yellow-800',
      receptionist: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role]}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search users by name, email, or username..."
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

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td>
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      {getRoleBadge(user.role)}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(user.is_active)}
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="danger" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {data?.data?.users?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new user'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((data.data.pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(data.data.pagination.currentPage * 10, data.data.pagination.totalUsers)} of{' '}
                {data.data.pagination.totalUsers} users
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

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="Enter first name" />
            <Input label="Last Name" placeholder="Enter last name" />
          </div>
          <Input label="Username" placeholder="Enter username" />
          <Input label="Email" type="email" placeholder="Enter email" />
          <Input label="Password" type="password" placeholder="Enter password" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input">
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="billing_clerk">Billing Clerk</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button>
              Add User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;