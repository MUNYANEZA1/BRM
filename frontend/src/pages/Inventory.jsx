import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingDown,
  Edit,
  Trash2,
  BarChart3,
  X
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../services/api';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockUpdateData, setStockUpdateData] = useState({
    quantity: 0,
    operation: 'add'
  });
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'food',
    unit: 'kg',
    currentStock: 0,
    minimumStock: 10,
    maximumStock: 50,
    unitCost: 0,
    supplier: {
      name: '',
      contact: '',
      email: ''
    },
    expiryDate: '',
    location: ''
  });

  // Fetch inventory items from API
  const { data: inventoryResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      try {
        const response = await inventoryAPI.getInventoryItems({ limit: 100 });
        console.log('Inventory data fetched:', response.data.data.inventoryItems);
        return response.data.data.inventoryItems || [];
      } catch (err) {
        console.error('Error fetching inventory:', err);
        throw err;
      }
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'stale', // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: (data) => inventoryAPI.createInventoryItem(data),
    onSuccess: async (response) => {
      toast.success(response.data.message || 'Item added successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        sku: '',
        category: 'food',
        unit: 'kg',
        currentStock: 0,
        minimumStock: 10,
        maximumStock: 50,
        unitCost: 0,
        supplier: {
          name: '',
          contact: '',
          email: ''
        },
        expiryDate: '',
        location: ''
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add item';
      toast.error(message);
    }
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryAPI.updateInventoryItem(id, data),
    onSuccess: async (response) => {
      toast.success(response.data.message || 'Item updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsEditModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update item';
      toast.error(message);
    }
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id) => inventoryAPI.deleteInventoryItem(id),
    onSuccess: async (response) => {
      toast.success(response.data.message || 'Item deleted successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete item';
      toast.error(message);
    }
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryAPI.updateStock(id, data),
    onSuccess: async (response) => {
      toast.success(response.data.message || 'Stock updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsStockModalOpen(false);
      setSelectedItem(null);
      setStockUpdateData({ quantity: 0, operation: 'add' });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update stock';
      toast.error(message);
    }
  });

  // Log when data is loaded
  useEffect(() => {
    if (inventoryResponse && inventoryResponse.length > 0) {
      console.log(`✓ Successfully loaded ${inventoryResponse.length} inventory items`);
    } else if (inventoryResponse && inventoryResponse.length === 0) {
      console.warn('⚠ No inventory items found in database');
    }
  }, [inventoryResponse]);

  // Handler functions for actions
  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      unitCost: item.unitCost,
      supplier: item.supplier || { name: '', contact: '', email: '' },
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      location: item.location || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStock = (item) => {
    setSelectedItem(item);
    setStockUpdateData({ quantity: 0, operation: 'add' });
    setIsStockModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    updateItemMutation.mutate({ id: selectedItem._id, data: formData });
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (stockUpdateData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    updateStockMutation.mutate({ 
      id: selectedItem._id, 
      data: stockUpdateData 
    });
  };

  const handleConfirmDelete = () => {
    deleteItemMutation.mutate(selectedItem._id);
  };

  // Use actual data from database
  const inventoryItems = Array.isArray(inventoryResponse) ? inventoryResponse : [
    {
      id: 1,
      name: 'Chicken Breast',
      description: 'Fresh chicken breast for grilling',
      sku: 'CHI001',
      category: 'food',
      unit: 'kg',
      currentStock: 15,
      minimumStock: 10,
      maximumStock: 50,
      unitCost: 3500,
      supplier: {
        name: 'Fresh Foods Ltd',
        contact: '+250 123 456 789'
      },
      expiryDate: '2024-09-10',
      location: 'Freezer A',
      isActive: true,
      lastRestocked: '2024-09-03'
    },
    {
      id: 2,
      name: 'Tomatoes',
      description: 'Fresh red tomatoes',
      sku: 'TOM001',
      category: 'food',
      unit: 'kg',
      currentStock: 5,
      minimumStock: 8,
      maximumStock: 25,
      unitCost: 800,
      supplier: {
        name: 'Green Valley Farm',
        contact: '+250 987 654 321'
      },
      expiryDate: '2024-09-07',
      location: 'Cold Storage',
      isActive: true,
      lastRestocked: '2024-09-04'
    },
    {
      id: 3,
      name: 'Coca Cola 500ml',
      description: 'Coca Cola bottles 500ml',
      sku: 'COK001',
      category: 'beverage',
      unit: 'bottles',
      currentStock: 0,
      minimumStock: 24,
      maximumStock: 100,
      unitCost: 800,
      supplier: {
        name: 'Beverage Distributors',
        contact: '+250 555 123 456'
      },
      expiryDate: '2025-03-15',
      location: 'Beverage Storage',
      isActive: true,
      lastRestocked: '2024-08-28'
    },
    {
      id: 4,
      name: 'Cooking Oil',
      description: 'Vegetable cooking oil 5L',
      sku: 'OIL001',
      category: 'supplies',
      unit: 'bottles',
      currentStock: 8,
      minimumStock: 5,
      maximumStock: 20,
      unitCost: 4500,
      supplier: {
        name: 'Kitchen Supplies Co',
        contact: '+250 444 789 123'
      },
      expiryDate: '2025-01-20',
      location: 'Dry Storage',
      isActive: true,
      lastRestocked: '2024-09-01'
    },
    {
      id: 5,
      name: 'Cleaning Detergent',
      description: 'Multi-purpose cleaning detergent',
      sku: 'CLN001',
      category: 'cleaning',
      unit: 'bottles',
      currentStock: 12,
      minimumStock: 6,
      maximumStock: 30,
      unitCost: 2500,
      supplier: {
        name: 'Cleaning Solutions Ltd',
        contact: '+250 333 456 789'
      },
      expiryDate: null,
      location: 'Cleaning Closet',
      isActive: true,
      lastRestocked: '2024-08-30'
    }
  ];

  const getStockStatus = (item) => {
    if (item.currentStock <= 0) return 'out_of_stock';
    if (item.currentStock <= item.minimumStock) return 'low_stock';
    if (item.maximumStock && item.currentStock >= item.maximumStock) return 'overstock';
    return 'in_stock';
  };

  const getStockStatusColor = (status) => {
    const colors = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      overstock: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const stockStatus = getStockStatus(item);
    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'currentStock' || name === 'minimumStock' || name === 'maximumStock' || name === 'unitCost'
          ? parseFloat(value) || 0
          : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (formData.unitCost <= 0) {
      toast.error('Unit cost must be greater than 0');
      return;
    }

    createItemMutation.mutate(formData);
  };

  // Calculate summary stats
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => getStockStatus(item) === 'low_stock').length;
  const outOfStockItems = inventoryItems.filter(item => getStockStatus(item) === 'out_of_stock').length;
  const expiringItems = inventoryItems.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== null && days <= 7 && days >= 0;
  }).length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-medium">Error loading inventory:</span> {error?.message || 'Failed to fetch inventory items'}
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
      {(isModalOpen || isEditModalOpen || isStockModalOpen || isDeleteModalOpen) && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 pointer-events-none" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Manage your restaurant inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline flex items-center cursor-pointer"
            title="Refresh inventory data"
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
            Add Item
          </button>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="text-blue-900">
            <span className="font-medium">Debug:</span> {inventoryItems.length} items loaded | API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="beverage">Beverage</option>
                <option value="alcohol">Alcohol</option>
                <option value="supplies">Supplies</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:w-48">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="overstock">Overstock</option>
              </select>
            </div>

            <button className="btn-outline flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const stockValue = item.currentStock * item.unitCost;
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                  
                  return (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.sku || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {item.minimumStock} {item.unit}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(stockStatus)}`}>
                          {stockStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.unitCost)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(stockValue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(item.expiryDate)}</div>
                        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                          <div className={`text-xs ${daysUntilExpiry <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days left`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleUpdateStock(item)}
                            className="text-primary-600 hover:text-primary-900 transition-colors cursor-pointer" 
                            title="Update Stock"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditItem(item)}
                            className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" 
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600 hover:text-red-900 transition-colors cursor-pointer" 
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No inventory items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Item: {selectedItem.name}</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input w-full"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input w-full"
                  >
                    <option value="food">Food</option>
                    <option value="beverage">Beverage</option>
                    <option value="alcohol">Alcohol</option>
                    <option value="supplies">Supplies</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input w-full"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pieces">Pieces</option>
                    <option value="bottles">Bottles</option>
                    <option value="cans">Cans</option>
                    <option value="boxes">Boxes</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    value={formData.maximumStock}
                    onChange={(e) => setFormData({ ...formData, maximumStock: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (RWF)</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Freezer A"
                />
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-outline cursor-pointer"
                  disabled={updateItemMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {isStockModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Update Stock: {selectedItem.name}</h2>
              <button 
                onClick={() => setIsStockModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="px-6 py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Current Stock:</span> {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                <select
                  value={stockUpdateData.operation}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, operation: e.target.value })}
                  className="input w-full"
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Remove Stock</option>
                  <option value="set">Set to Exact Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity {stockUpdateData.operation === 'set' ? '(Final Amount)' : ''}
                </label>
                <input
                  type="number"
                  value={stockUpdateData.quantity}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, quantity: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {stockUpdateData.operation === 'set' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-900">
                    Stock will be set to <span className="font-bold">{stockUpdateData.quantity} {selectedItem.unit}</span>
                  </p>
                </div>
              )}
              {stockUpdateData.operation === 'add' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900">
                    New stock: <span className="font-bold">{selectedItem.currentStock + stockUpdateData.quantity} {selectedItem.unit}</span>
                  </p>
                </div>
              )}
              {stockUpdateData.operation === 'subtract' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-900">
                    New stock: <span className="font-bold">{Math.max(0, selectedItem.currentStock - stockUpdateData.quantity)} {selectedItem.unit}</span>
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="btn-outline cursor-pointer"
                  disabled={updateStockMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                  disabled={updateStockMutation.isPending}
                >
                  {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <h2 className="text-xl font-bold text-red-900">Delete Item</h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-bold">{selectedItem.name}</span>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All inventory records for this item will be permanently deleted.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-900">
                  <span className="font-medium">Item Details:</span>
                  <br />
                  SKU: {selectedItem.sku || 'N/A'}
                  <br />
                  Category: {selectedItem.category}
                  <br />
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-outline cursor-pointer"
                disabled={deleteItemMutation.isPending}
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white hover:bg-red-700 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 shadow-sm cursor-pointer"
                disabled={deleteItemMutation.isPending}
              >
                {deleteItemMutation.isPending ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Item Name & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="e.g., Chicken Breast"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="e.g., CHI001"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Item description"
                  rows="2"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="food">Food</option>
                    <option value="beverage">Beverage</option>
                    <option value="alcohol">Alcohol</option>
                    <option value="supplies">Supplies</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pieces">Pieces</option>
                    <option value="bottles">Bottles</option>
                    <option value="cans">Cans</option>
                    <option value="boxes">Boxes</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              {/* Stock Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    name="minimumStock"
                    value={formData.minimumStock}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="10"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    name="maximumStock"
                    value={formData.maximumStock}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="50"
                    min="0"
                  />
                </div>
              </div>

              {/* Unit Cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost (RWF) *
                  </label>
                  <input
                    type="number"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="0"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Supplier Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplier.name"
                      value={formData.supplier.name}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Supplier name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <input
                      type="tel"
                      name="supplier.contact"
                      value={formData.supplier.contact}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="+250 123 456 789"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="supplier.email"
                      value={formData.supplier.email}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="e.g., Freezer A"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline cursor-pointer"
                  disabled={createItemMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

