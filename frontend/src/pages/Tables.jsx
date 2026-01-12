import React, { useState, useEffect } from 'react';
import { Plus, QrCode, Users, MapPin, Clock, Edit, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tablesAPI } from '../services/api';

const Tables = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [locationFilter, setLocationFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    location: 'indoor',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch tables
  const { data: tablesResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      try {
        const response = await tablesAPI.getTables({ limit: 100 });
        return response.data.data.tables || [];
      } catch (err) {
        console.error('Failed to fetch tables:', err);
        throw err;
      }
    },
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 3,
  });

  const tables = Array.isArray(tablesResponse) ? tablesResponse : [];

  // Mutations
  const createTableMutation = useMutation({
    mutationFn: (newTable) => tablesAPI.createTable(newTable),
    onSuccess: () => {
      toast.success('Table created successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsModalOpen(false);
      resetFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create table');
      console.error('Create table error:', error.response?.data);
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ tableId, data }) => tablesAPI.updateTable(tableId, data),
    onSuccess: () => {
      toast.success('Table updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsEditModalOpen(false);
      setSelectedTable(null);
      resetFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update table');
      console.error('Update table error:', error.response?.data);
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: (tableId) => tablesAPI.deleteTable(tableId),
    onSuccess: () => {
      toast.success('Table deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDeleteModalOpen(false);
      setSelectedTable(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete table');
      console.error('Delete table error:', error.response?.data);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ tableId, status }) => tablesAPI.updateTableStatus(tableId, status),
    onSuccess: () => {
      toast.success('Table status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      console.error('Update status error:', error.response?.data);
    }
  });

  const getQRCodeMutation = useMutation({
    mutationFn: (tableId) => tablesAPI.getTableQRCode(tableId),
    onSuccess: (response) => {
      setQrCodeData(response.data.data);
      setIsQRModalOpen(true);
      toast.success('QR code generated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
      console.error('QR code error:', error.response?.data);
    }
  });

  // Helper functions
  const resetFormData = () => {
    setFormData({
      number: '',
      capacity: '',
      location: 'indoor',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value
    }));
  };

  const handleEditTable = (table) => {
    setSelectedTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      notes: table.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTable = (table) => {
    setSelectedTable(table);
    setIsDeleteModalOpen(true);
  };

  const handleShowQRCode = (table) => {
    setSelectedTable(table);
    getQRCodeMutation.mutate(table._id);
  };

  const handleChangeStatus = (table) => {
    setSelectedTable(table);
    setSelectedStatus(table.status);
    setIsStatusModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.number || !formData.capacity || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTableMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!formData.number || !formData.capacity || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateTableMutation.mutate({
      tableId: selectedTable._id,
      data: formData
    });
  };

  const handleConfirmDelete = () => {
    deleteTableMutation.mutate(selectedTable._id);
  };

  useEffect(() => {
    if (tables.length > 0) {
      console.log('Tables loaded:', tables);
    }
  }, [tables]);

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-red-100 text-red-800 border-red-200',
      reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cleaning: 'bg-blue-100 text-blue-800 border-blue-200',
      out_of_order: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '👥';
      case 'reserved':
        return '📅';
      case 'cleaning':
        return '🧹';
      case 'out_of_order':
        return '⚠️';
      default:
        return '?';
    }
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'indoor':
        return '🏠';
      case 'outdoor':
        return '🌳';
      case 'bar':
        return '🍺';
      case 'vip':
        return '⭐';
      case 'private':
        return '🔒';
      default:
        return '📍';
    }
  };

  const filteredTables = tables.filter(table => {
    const matchesLocation = locationFilter === 'all' || table.location === locationFilter;
    const matchesSearch = table.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading tables...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-medium">Error loading tables:</span> {error?.message || 'Failed to fetch tables'}
          </p>
          {error?.response?.data?.message && (
            <p className="text-red-700 text-sm mt-2">
              Server message: {error.response.data.message}
            </p>
          )}
          <button 
            onClick={() => refetch()}
            className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
      <>
      {/* Page Background Blur when Modal is Open */}
      {(isModalOpen || isEditModalOpen || isDeleteModalOpen) && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-600">Manage restaurant tables and seating</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline flex items-center cursor-pointer"
            title="Refresh tables list"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Tables</label>
                <input
                  type="text"
                  placeholder="Search by table number or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Locations</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="bar">Bar</option>
                  <option value="vip">VIP</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 sm:mt-6">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['available', 'occupied', 'reserved', 'cleaning', 'out_of_order'].map(status => {
          const count = filteredTables.filter(table => table.status === status).length;
          return (
            <div key={status} className="card">
              <div className="card-content">
                <div className="text-center">
                  <div className="text-2xl mb-1">{getStatusIcon(status)}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <div key={table._id} className={`card border-2 ${getStatusColor(table.status)}`}>
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-gray-900">{table.number}</h3>
                    <span className="text-lg">{getLocationIcon(table.location)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{table.capacity}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleChangeStatus(table)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(table.status)}`}
                      title="Click to change status"
                    >
                      {table.status.replace('_', ' ')}
                    </button>
                    <span className="text-xs text-gray-500 capitalize">{table.location}</span>
                  </div>

                  {table.currentOrder && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {table.currentOrder.customerName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeSince(table.currentOrder.startTime)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(table.currentOrder.total)}
                      </div>
                    </div>
                  )}

                  {table.notes && (
                    <div className="text-xs text-gray-500">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {table.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button 
                      onClick={() => handleShowQRCode(table)}
                      className="flex items-center text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </button>
                    
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditTable(table)}
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTable(table)}
                        className="p-1 text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="pt-3 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Change Status:</label>
                    <select
                      value={table.status}
                      onChange={(e) => updateStatusMutation.mutate({ tableId: table._id, status: e.target.value })}
                      disabled={updateStatusMutation.isPending}
                      className="input text-xs w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="available">✓ Available</option>
                      <option value="occupied">👥 Occupied</option>
                      <option value="reserved">📅 Reserved</option>
                      <option value="cleaning">🧹 Cleaning</option>
                      <option value="out_of_order">⚠️ Out of Order</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTables.map((table) => (
                    <tr key={table._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{table.number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getLocationIcon(table.location)}</span>
                          <span className="text-sm text-gray-900 capitalize">{table.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{table.capacity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={table.status}
                          onChange={(e) => updateStatusMutation.mutate({ tableId: table._id, status: e.target.value })}
                          disabled={updateStatusMutation.isPending}
                          className={`text-xs font-medium px-2 py-1 rounded-full cursor-pointer border-0 ${getStatusColor(table.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="available">✓ Available</option>
                          <option value="occupied">👥 Occupied</option>
                          <option value="reserved">📅 Reserved</option>
                          <option value="cleaning">🧹 Cleaning</option>
                          <option value="out_of_order">⚠️ Out of Order</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {table.currentOrder ? (
                          <div>
                            <div className="text-sm text-gray-900">{table.currentOrder.customerName}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(table.currentOrder.total)} • {getTimeSince(table.currentOrder.startTime)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{table.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleShowQRCode(table)}
                            className="text-primary-600 hover:text-primary-900 cursor-pointer transition-colors"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditTable(table)}
                            className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTable(table)}
                            className="text-red-600 hover:text-red-900 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tables found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Table</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="T-01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="4"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="bar">Bar</option>
                  <option value="vip">VIP</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="e.g., Near window, corner spot..."
                  rows="3"
                  maxLength="200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTableMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {isEditModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Table</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTable(null);
                  resetFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="input w-full"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="bar">Bar</option>
                  <option value="vip">VIP</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="e.g., Near window, corner spot..."
                  rows="3"
                  maxLength="200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTable(null);
                    resetFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTableMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateTableMutation.isPending ? 'Updating...' : 'Update Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Table Modal */}
      {isDeleteModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                Delete Table
              </h3>
              
              <p className="mt-2 text-sm text-gray-500 text-center">
                Are you sure you want to delete table{' '}
                <span className="font-medium text-gray-900">
                  {selectedTable.number}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Capacity:</span> {selectedTable.capacity} persons
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Location:</span> {selectedTable.location}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Status:</span> {selectedTable.status.replace('_', ' ')}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedTable(null);
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete()}
                  disabled={deleteTableMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteTableMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Table {selectedTable?.number} - QR Code</h3>
              <button
                onClick={() => {
                  setIsQRModalOpen(false);
                  setQrCodeData(null);
                  setSelectedTable(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                {qrCodeData?.qrCodeDataUrl ? (
                  <img 
                    src={qrCodeData.qrCodeDataUrl} 
                    alt="Table QR Code" 
                    className="w-full max-w-xs"
                  />
                ) : (
                  <div className="text-gray-500">Loading QR code...</div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">QR Code ID:</span> {qrCodeData?.table?.qrCode}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Scan to access:</span> Customer Menu
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeData.qrCodeDataUrl;
                    link.download = `table-${selectedTable?.number}-qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 btn-primary cursor-pointer"
                >
                  Download QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeData.qrCodeUrl);
                    toast.success('URL copied to clipboard');
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Copy URL
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsQRModalOpen(false);
                  setQrCodeData(null);
                  setSelectedTable(null);
                }}
                className="w-full btn-outline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {isStatusModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Change Table Status</h3>
              <button
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedTable(null);
                  setSelectedStatus(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Table:</span> {selectedTable?.number}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Status:</span> 
                  <span className={`inline-block ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTable?.status)}`}>
                    {selectedTable?.status.replace('_', ' ')}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select New Status:</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'available', label: '✓ Available - Table ready for customers', description: 'Cleaned and ready' },
                    { value: 'occupied', label: '👥 Occupied - Currently being used', description: 'Customers seated' },
                    { value: 'reserved', label: '📅 Reserved - Booking confirmed', description: 'Reserved for later' },
                    { value: 'cleaning', label: '🧹 Cleaning - Being cleaned', description: 'Under maintenance' },
                    { value: 'out_of_order', label: '⚠️ Out of Order - Not available', description: 'Damaged or broken' },
                  ].map((statusOption) => (
                    <button
                      key={statusOption.value}
                      onClick={() => setSelectedStatus(statusOption.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedStatus === statusOption.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{statusOption.label}</div>
                      <div className="text-xs text-gray-500">{statusOption.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedTable(null);
                    setSelectedStatus(null);
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStatus) {
                      updateStatusMutation.mutate({
                        tableId: selectedTable._id,
                        status: selectedStatus
                      });
                      setIsStatusModalOpen(false);
                      setSelectedTable(null);
                      setSelectedStatus(null);
                    }
                  }}
                  disabled={!selectedStatus || updateStatusMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default Tables;

