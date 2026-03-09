import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, FolderPlus, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { menuAPI, uploadAPI } from '../services/api';
import { devLog } from '../utils/logger';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    category: '',
    preparationTime: 15,
    isAvailable: true,
    image: '',
    tags: []
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await menuAPI.getCategories();
        return response.data.data.categories || [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        throw err;
      }
    },
    retry: 3,
  });

  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];

  // Fetch menu items
  const { data: menuItemsResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      try {
        const response = await menuAPI.getMenuItems({ limit: 100 });
        return response.data.data.items || [];
      } catch (err) {
        console.error('Error fetching menu items:', err);
        throw err;
      }
    },
    retry: 3,
  });

  const menuItems = Array.isArray(menuItemsResponse) ? menuItemsResponse : [];
  
  // Filter items by selected category
  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.category._id === selectedCategory)
    : menuItems;

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (data) => inventoryAPI.createInventoryItem(data),
    onSuccess: () => {
      toast.success('Menu item created successfully');
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsModalOpen(false);
      resetFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }) => inventoryAPI.updateInventoryItem(itemId, data),
    onSuccess: () => {
      toast.success('Menu item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => inventoryAPI.deleteInventoryItem(itemId),
    onSuccess: () => {
      toast.success('Menu item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  });

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
      maximumStock: item.maximumStock || 50,
      unitCost: item.unitCost,
      supplier: item.supplier || { name: '', contact: '', email: '' },
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      location: item.location || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const resetFormData = () => {
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
  };

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
        [name]: ['currentStock', 'minimumStock', 'maximumStock', 'unitCost'].includes(name)
          ? parseFloat(value) || 0
          : value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

    if (selectedItem) {
      updateItemMutation.mutate({ itemId: selectedItem._id, data: formData });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600">Manage menu items from your inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline flex items-center cursor-pointer"
            title="Refresh menu data"
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading menu items...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-medium">Error loading menu:</span> {error?.message || 'Failed to fetch menu items'}
          </p>
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
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-full sm:w-40"
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

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.currentStock <= 0 ? 'bg-red-100 text-red-800' :
                        item.currentStock <= item.minimumStock ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
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
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">No menu items found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditModalOpen ? `Edit: ${selectedItem.name}` : 'Add Menu Item'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedItem(null);
                  resetFormData();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Item description"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (RWF) *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
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

              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                    resetFormData();
                  }}
                  className="btn-outline cursor-pointer"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {isEditModalOpen ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delete Item?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="btn-outline cursor-pointer"
                  disabled={deleteItemMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteItemMutation.mutate(selectedItem._id)}
                  className="btn-danger cursor-pointer"
                  disabled={deleteItemMutation.isPending}
                >
                  {deleteItemMutation.isPending ? 'Deleting...' : 'Delete Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

