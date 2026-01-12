import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { menuAPI } from '../services/api';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isMenuEditModalOpen, setIsMenuEditModalOpen] = useState(false);
  const [isMenuDeleteModalOpen, setIsMenuDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    preparationTime: '15',
    isAvailable: true
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sortOrder: ''
  });

  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: itemsResponse, isLoading: itemsLoading, isError: itemsError, error: itemsErrorObj, refetch: refetchItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const response = await menuAPI.getMenuItems({ limit: 100 });
      return response.data.data.items || [];
    },
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 3,
  });

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading, isError: categoriesError, error: categoriesErrorObj, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await menuAPI.getCategories({ limit: 100 });
      return response.data.data.categories || [];
    },
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 3,
  });

  const menuItems = Array.isArray(itemsResponse) ? itemsResponse : [];
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];

  // Menu Item Mutations
  const createMenuItemMutation = useMutation({
    mutationFn: (data) => menuAPI.createMenuItem(data),
    onSuccess: () => {
      toast.success('Menu item created successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsMenuModalOpen(false);
      resetMenuFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create menu item');
      console.error('Create menu item error:', error.response?.data);
    }
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ itemId, data }) => menuAPI.updateMenuItem(itemId, data),
    onSuccess: () => {
      toast.success('Menu item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsMenuEditModalOpen(false);
      setSelectedMenuItem(null);
      resetMenuFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update menu item');
      console.error('Update menu item error:', error.response?.data);
    }
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: (itemId) => menuAPI.deleteMenuItem(itemId),
    onSuccess: () => {
      toast.success('Menu item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsMenuDeleteModalOpen(false);
      setSelectedMenuItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
      console.error('Delete menu item error:', error.response?.data);
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }) => menuAPI.updateMenuItem(itemId, { isAvailable }),
    onSuccess: () => {
      toast.success('Availability updated');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update availability');
      console.error('Update availability error:', error.response?.data);
    }
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data) => menuAPI.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      resetCategoryFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
      console.error('Create category error:', error.response?.data);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, data }) => menuAPI.updateCategory(categoryId, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryEditModalOpen(false);
      setSelectedCategory(null);
      resetCategoryFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
      console.error('Update category error:', error.response?.data);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => menuAPI.deleteCategory(categoryId),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDeleteModalOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
      console.error('Delete category error:', error.response?.data);
    }
  });

  // Helper functions
  const resetMenuFormData = () => {
    setMenuFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      preparationTime: '15',
      isAvailable: true
    });
  };

  const resetCategoryFormData = () => {
    setCategoryFormData({
      name: '',
      description: '',
      sortOrder: ''
    });
  };

  const handleMenuInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'price' || name === 'cost' || name === 'preparationTime' ? parseFloat(value) || '' : value)
    }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: name === 'sortOrder' ? parseInt(value) || '' : value
    }));
  };

  const handleEditMenuItem = (item) => {
    setSelectedMenuItem(item);
    setMenuFormData({
      name: item.name,
      description: item.description || '',
      category: item.category._id || item.category,
      price: item.price,
      cost: item.cost || '',
      preparationTime: item.preparationTime || 15,
      isAvailable: item.isAvailable
    });
    setIsMenuEditModalOpen(true);
  };

  const handleDeleteMenuItem = (item) => {
    setSelectedMenuItem(item);
    setIsMenuDeleteModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder || ''
    });
    setIsCategoryEditModalOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryDeleteModalOpen(true);
  };

  const handleCreateMenuSubmit = (e) => {
    e.preventDefault();
    if (!menuFormData.name || !menuFormData.category || !menuFormData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMenuItemMutation.mutate(menuFormData);
  };

  const handleEditMenuSubmit = (e) => {
    e.preventDefault();
    if (!menuFormData.name || !menuFormData.category || !menuFormData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateMenuItemMutation.mutate({
      itemId: selectedMenuItem._id,
      data: menuFormData
    });
  };

  const handleConfirmMenuDelete = () => {
    deleteMenuItemMutation.mutate(selectedMenuItem._id);
  };

  const handleCreateCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    createCategoryMutation.mutate(categoryFormData);
  };

  const handleEditCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateCategoryMutation.mutate({
      categoryId: selectedCategory._id,
      data: categoryFormData
    });
  };

  const handleConfirmCategoryDelete = () => {
    deleteCategoryMutation.mutate(selectedCategory._id);
  };

  useEffect(() => {
    if (menuItems.length > 0) {
      console.log('Menu items loaded:', menuItems);
    }
  }, [menuItems]);

  useEffect(() => {
    if (categories.length > 0) {
      console.log('Categories loaded:', categories);
    }
  }, [categories]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProfitMargin = (price, cost) => {
    if (cost === 0) return 0;
    return ((price - cost) / price * 100).toFixed(1);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category._id.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {(itemsLoading || categoriesLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading menu data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {(itemsError || categoriesError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-medium">Error loading menu:</span> {itemsErrorObj?.message || categoriesErrorObj?.message || 'Failed to fetch menu data'}
          </p>
          <button 
            onClick={() => {
              refetchItems();
              refetchCategories();
            }}
            className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!itemsLoading && !categoriesLoading && !itemsError && !categoriesError && (
      <>
      {/* Page Background Blur when Modal is Open */}
      {(isMenuModalOpen || isMenuEditModalOpen || isMenuDeleteModalOpen || isCategoryModalOpen || isCategoryEditModalOpen || isCategoryDeleteModalOpen) && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu items and categories</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => {
              refetchItems();
              refetchCategories();
            }}
            className="btn-outline flex items-center cursor-pointer"
            title="Refresh menu"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button 
            onClick={() => activeTab === 'items' ? setIsMenuModalOpen(true) : setIsCategoryModalOpen(true)}
            className="btn-primary flex items-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'items' ? 'Menu Item' : 'Category'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Menu Items ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories ({categories.length})
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="card-content">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search menu items..."
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
                    {categories.map(category => (
                      <option key={category._id} value={category._id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <div key={item._id} className="card">
                <div className="card-content">
                  <div className="relative">
                    <img
                      src={item.image || '/api/placeholder/150/150'}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{typeof item.category === 'object' ? item.category.name : 'Category'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-gray-500">
                          Cost: {formatCurrency(item.cost || 0)} • 
                          Margin: {calculateProfitMargin(item.price, item.cost || 0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{item.preparationTime} min</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <button
                        onClick={() => toggleAvailabilityMutation.mutate({ itemId: item._id, isAvailable: !item.isAvailable })}
                        disabled={toggleAvailabilityMutation.isPending}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {item.isAvailable ? (
                          <ToggleRight className="h-5 w-5 text-green-600 mr-1" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400 mr-1" />
                        )}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditMenuItem(item)}
                          className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMenuItem(item)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No menu items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <div className="card">
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => {
                    const itemCount = menuItems.filter(item => item.category._id === category._id).length;
                    return (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{category.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{itemCount} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{category.sortOrder || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleEditCategory(category)}
                              className="text-primary-600 hover:text-primary-900 cursor-pointer transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-900 cursor-pointer transition-colors"
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
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Add Menu Item</h3>
              <button
                onClick={() => {
                  setIsMenuModalOpen(false);
                  resetMenuFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={menuFormData.name}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={menuFormData.description}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={menuFormData.category}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF) *</label>
                  <input
                    type="number"
                    name="price"
                    value={menuFormData.price}
                    onChange={handleMenuInputChange}
                    className="input w-full"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (RWF)</label>
                  <input
                    type="number"
                    name="cost"
                    value={menuFormData.cost}
                    onChange={handleMenuInputChange}
                    className="input w-full"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
                <input
                  type="number"
                  name="preparationTime"
                  value={menuFormData.preparationTime}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={menuFormData.isAvailable}
                    onChange={handleMenuInputChange}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuModalOpen(false);
                    resetMenuFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMenuItemMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMenuItemMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {isMenuEditModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Edit Menu Item</h3>
              <button
                onClick={() => {
                  setIsMenuEditModalOpen(false);
                  setSelectedMenuItem(null);
                  resetMenuFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditMenuSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={menuFormData.name}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={menuFormData.description}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={menuFormData.category}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF) *</label>
                  <input
                    type="number"
                    name="price"
                    value={menuFormData.price}
                    onChange={handleMenuInputChange}
                    className="input w-full"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (RWF)</label>
                  <input
                    type="number"
                    name="cost"
                    value={menuFormData.cost}
                    onChange={handleMenuInputChange}
                    className="input w-full"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
                <input
                  type="number"
                  name="preparationTime"
                  value={menuFormData.preparationTime}
                  onChange={handleMenuInputChange}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={menuFormData.isAvailable}
                    onChange={handleMenuInputChange}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuEditModalOpen(false);
                    setSelectedMenuItem(null);
                    resetMenuFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMenuItemMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMenuItemMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Menu Item Modal */}
      {isMenuDeleteModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Delete Menu Item</h3>
              
              <p className="mt-2 text-sm text-gray-500 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{selectedMenuItem.name}</span>? This action cannot be undone.
              </p>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Price:</span> {formatCurrency(selectedMenuItem.price)}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuDeleteModalOpen(false);
                    setSelectedMenuItem(null);
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmMenuDelete()}
                  disabled={deleteMenuItemMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteMenuItemMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  resetCategoryFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={categoryFormData.sortOrder}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    resetCategoryFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isCategoryEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
              <button
                onClick={() => {
                  setIsCategoryEditModalOpen(false);
                  setSelectedCategory(null);
                  resetCategoryFormData();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={categoryFormData.sortOrder}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryEditModalOpen(false);
                    setSelectedCategory(null);
                    resetCategoryFormData();
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCategoryMutation.isPending}
                  className="flex-1 btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateCategoryMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {isCategoryDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Delete Category</h3>
              
              <p className="mt-2 text-sm text-gray-500 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{selectedCategory.name}</span>? This action cannot be undone.
              </p>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Items in category:</span> {menuItems.filter(item => item.category._id === selectedCategory._id).length}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDeleteModalOpen(false);
                    setSelectedCategory(null);
                  }}
                  className="flex-1 btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmCategoryDelete()}
                  disabled={deleteCategoryMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
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

export default Menu;

