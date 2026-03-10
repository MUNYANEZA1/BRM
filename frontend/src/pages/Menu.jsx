import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit, Trash2, X, FolderPlus, AlertCircle, CheckCircle, ClipboardCopy, Menu as MenuIcon, PanelLeftClose, Download } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { menuAPI, uploadAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Menu = () => {
  const { user } = useAuth();
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    category: '',
    preparationTime: 15,
    isAvailable: true,
    tags: []
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // prepare customer menu URL / QR based on company
  const companyId = user?.company;
  const customerMenuUrl = companyId
    ? `${window.location.origin}/customer-menu?company=${companyId}`
    : '';
  const qrCodeSrc = customerMenuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(customerMenuUrl)}&size=120x120`
    : '';

  const handleCopyUrl = () => {
    if (customerMenuUrl) {
      navigator.clipboard.writeText(customerMenuUrl);
      toast.success('Customer menu URL copied');
    }
  };

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
        return response.data.data.menuItems || [];
      } catch (err) {
        console.error('Error fetching menu items:', err);
        throw err;
      }
    },
    retry: 3,
  });

  const menuItems = Array.isArray(menuItemsResponse) ? menuItemsResponse : [];
  
  // Filter items by search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Menu Item Mutations
  const createItemMutation = useMutation({
    mutationFn: async (data) => {
      let uploadedImageUrl = null;
      if (imageFile) {
        const uploadResponse = await uploadAPI.uploadImage(imageFile);
        uploadedImageUrl = uploadResponse.data.data.imageUrl;
      }
      return menuAPI.createMenuItem({
        ...data,
        image: uploadedImageUrl || undefined
      });
    },
    onSuccess: () => {
      toast.success('Menu item created successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsItemModalOpen(false);
      resetItemFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data) => {
      let uploadedImageUrl = itemFormData.image;
      if (imageFile) {
        const uploadResponse = await uploadAPI.uploadImage(imageFile);
        uploadedImageUrl = uploadResponse.data.data.imageUrl;
      }
      return menuAPI.updateMenuItem(selectedItem._id, {
        ...data,
        image: uploadedImageUrl
      });
    },
    onSuccess: () => {
      toast.success('Menu item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetItemFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => menuAPI.deleteMenuItem(itemId),
    onSuccess: () => {
      toast.success('Menu item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
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
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data) => menuAPI.updateCategory(selectedCategoryForDelete._id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditCategoryModalOpen(false);
      setSelectedCategoryForDelete(null);
      resetCategoryFormData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => menuAPI.deleteCategory(categoryId),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDeleteCategoryModalOpen(false);
      setSelectedCategoryForDelete(null);
      if (selectedCategory === selectedCategoryForDelete._id) {
        setSelectedCategory(null);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      cost: item.cost || 0,
      category: item.category._id,
      preparationTime: item.preparationTime || 15,
      isAvailable: item.isAvailable,
      tags: item.tags || [],
      image: item.image || ''
    });
    if (item.image) {
      setImagePreview(item.image);
    }
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategoryForDelete(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder || 0
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategoryForDelete(category);
    setIsDeleteCategoryModalOpen(true);
  };

  const resetItemFormData = () => {
    setItemFormData({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      category: '',
      preparationTime: 15,
      isAvailable: true,
      tags: []
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const resetCategoryFormData = () => {
    setCategoryFormData({
      name: '',
      description: '',
      sortOrder: 0
    });
  };

  const handleItemInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemFormData({
      ...itemFormData,
      [name]: type === 'checkbox' ? checked : (
        ['price', 'cost', 'preparationTime'].includes(name) ? parseFloat(value) || 0 : value
      )
    });
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: name === 'sortOrder' ? parseInt(value) || 0 : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitItem = (e) => {
    e.preventDefault();
    
    if (!itemFormData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!itemFormData.category) {
      toast.error('Category is required');
      return;
    }
    if (itemFormData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (selectedItem) {
      updateItemMutation.mutate(itemFormData);
    } else {
      createItemMutation.mutate(itemFormData);
    }
  };

  const handleSubmitCategory = (e) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (selectedCategoryForDelete && isEditCategoryModalOpen) {
      updateCategoryMutation.mutate(categoryFormData);
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Sidebar - Categories */}
      <div className={`w-full sm:w-64 flex-shrink-0 transition-all duration-300 ease-in-out z-50 bg-white ${sidebarOpen ? 'block fixed inset-y-0 left-0 md:relative md:inset-auto' : 'hidden md:block'}`}>
        <div className="sticky top-0">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Categories Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg">Categories</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                  title="Close Categories"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedCategoryForDelete(null);
                  resetCategoryFormData();
                  setIsCategoryModalOpen(true);
                }}
                className="w-full btn-white text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-2 py-2 text-sm"
              >
                <FolderPlus className="h-4 w-4" />
                New Category
              </button>
            </div>

            {/* Categories List */}
            {categoriesLoading ? (
              <div className="p-4 text-center text-gray-500">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {/* All Items Option */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedCategory === null 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">All Items</div>
                  <div className="text-xs text-gray-500">
                    {menuItems.length} items
                  </div>
                </button>

                {/* Category Items */}
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`user-select-none px-4 py-3 transition-colors cursor-pointer group hover:bg-gray-50 ${
                      selectedCategory === category._id 
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : ''
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCategory(category._id)}
                      className="w-full text-left"
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-gray-500">
                        {menuItems.filter(item => item.category._id === category._id).length} items
                      </div>
                    </button>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                      >
                        <Edit className="h-3 w-3 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="flex-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No categories yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              title={sidebarOpen ? 'Hide Categories' : 'Show Categories'}
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600">
                {selectedCategory 
                  ? `${categories.find(c => c._id === selectedCategory)?.name}`
                  : 'All Menu Items'
                } ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {customerMenuUrl && (
              <div className="flex flex-col sm:flex-row items-center bg-white border border-gray-200 rounded-lg p-2 space-y-2 sm:space-y-0 sm:space-x-2 shadow-sm">
                <img src={qrCodeSrc} alt="QR code" className="h-12 w-12" />
                <div className="flex items-center space-x-1">
                  <a
                    href={customerMenuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 underline truncate max-w-xs"
                    title={customerMenuUrl}
                  >
                    Customer menu link
                  </a>
                  <button onClick={handleCopyUrl} className="p-1">
                    <ClipboardCopy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  </button>
                  <a
                    href={qrCodeSrc}
                    download="customer-menu-qr.png"
                    className="p-1"
                    title="Download QR code"
                  >
                    <Download className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  </a>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setSelectedItem(null);
                resetItemFormData();
                setIsItemModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Menu Items */}
        {itemsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden transform hover:scale-[1.02]">
                {/* Item Image */}
                {item.image && (
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Item Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.category.name}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      item.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-primary-600">{formatCurrency(item.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost:</span>
                      <span className="text-gray-900">{formatCurrency(item.cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prep Time:</span>
                      <span className="text-gray-900">{item.preparationTime} min</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="flex-1 btn-outline flex items-center justify-center gap-2 py-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-gray-500 space-y-2">
                  <p className="text-xl font-semibold">No menu items found</p>
                  <p className="text-base">Try adjusting your search or create a new item</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {(isItemModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditModalOpen ? `Edit: ${selectedItem.name}` : 'Add Menu Item'}
              </h2>
              <button
                onClick={() => {
                  setIsItemModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedItem(null);
                  resetItemFormData();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={itemFormData.name}
                    onChange={handleItemInputChange}
                    className="input w-full"
                    placeholder="e.g., Grilled Fish"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={itemFormData.category}
                    onChange={handleItemInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (RWF) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={itemFormData.price}
                    onChange={handleItemInputChange}
                    className="input w-full"
                    placeholder="0"
                    step="100"
                    min="0"
                    required
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price (RWF)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={itemFormData.cost}
                    onChange={handleItemInputChange}
                    className="input w-full"
                    placeholder="0"
                    step="100"
                    min="0"
                  />
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={itemFormData.preparationTime}
                    onChange={handleItemInputChange}
                    className="input w-full"
                    placeholder="15"
                    min="1"
                  />
                </div>

                {/* Available */}
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={itemFormData.isAvailable}
                      onChange={handleItemInputChange}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Available for Order</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={itemFormData.description}
                  onChange={handleItemInputChange}
                  className="input w-full h-24"
                  placeholder="Enter item description..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image
                </label>
                {imagePreview && (
                  <div className="mb-4">
                    <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input w-full"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createItemMutation.isPending || updateItemMutation.isPending ? 'Saving...' : 'Save Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                    resetItemFormData();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Menu Item?</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{selectedItem.name}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteItemMutation.mutate(selectedItem._id)}
                  disabled={deleteItemMutation.isPending}
                  className="btn-danger flex-1"
                >
                  {deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(isCategoryModalOpen || isEditCategoryModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditCategoryModalOpen ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setIsEditCategoryModalOpen(false);
                  setSelectedCategoryForDelete(null);
                  resetCategoryFormData();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  placeholder="e.g., Appetizers"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  className="input w-full h-20"
                  placeholder="Enter category description..."
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={categoryFormData.sortOrder}
                  onChange={handleCategoryInputChange}
                  className="input w-full"
                  min="0"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setIsEditCategoryModalOpen(false);
                    setSelectedCategoryForDelete(null);
                    resetCategoryFormData();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {isDeleteCategoryModalOpen && selectedCategoryForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Category?</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <strong>{selectedCategoryForDelete.name}</strong>?
              </p>
              <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded mb-6">
                Note: Items in this category will not be deleted, but they will become unassigned.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteCategoryModalOpen(false);
                    setSelectedCategoryForDelete(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCategoryMutation.mutate(selectedCategoryForDelete._id)}
                  disabled={deleteCategoryMutation.isPending}
                  className="btn-danger flex-1"
                >
                  {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
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
