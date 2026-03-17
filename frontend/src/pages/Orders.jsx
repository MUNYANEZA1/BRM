import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Trash2,
  X,
  ShoppingCart
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersAPI, tablesAPI, menuAPI } from '../services/api';
import { devLog } from '../utils/logger';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [orderNotes, setOrderNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch orders
  const { data: ordersResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersAPI.getOrders({ limit: 100 });
      return response.data.data.orders || [];
    },
    retry: 3,
  });

  const orders = Array.isArray(ordersResponse) ? ordersResponse : [];

  // Fetch tables
  const { data: tablesResponse, error: tablesError } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await tablesAPI.getTables({ limit: 100 });
      return response.data.data.tables || [];
    },
    retry: 3,
  });

  const tables = Array.isArray(tablesResponse) ? tablesResponse : [];

  // Fetch menu items
  const { data: menuResponse, error: menuError } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const response = await menuAPI.getMenuItems({ limit: 100 });
      return response.data.data.menuItems || [];
    },
    retry: 3,
  });

  const menuItems = Array.isArray(menuResponse) ? menuResponse : [];

  // Mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => ordersAPI.updateOrder(orderId, { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
      console.error('Update order error:', error.response?.data);
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ orderId, paymentStatus }) => ordersAPI.updateOrder(orderId, { paymentStatus }),
    onSuccess: () => {
      toast.success('Payment status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update payment');
      console.error('Update payment error:', error.response?.data);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => ordersAPI.deleteOrder(orderId),
    onSuccess: () => {
      toast.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete order');
      console.error('Delete order error:', error.response?.data);
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => ordersAPI.createOrder(orderData),
    onSuccess: () => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsCreateOrderModalOpen(false);
      setSelectedTable(null);
      setOrderItems([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setOrderNotes('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
      console.error('Create order error:', error);
    }
  });

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteOrderMutation.mutate(selectedOrder._id);
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handlePaymentStatusChange = (orderId, newPaymentStatus) => {
    updatePaymentStatusMutation.mutate({ orderId, paymentStatus: newPaymentStatus });
  };

  const handleCreateOrder = () => {
    setIsCreateOrderModalOpen(true);
  };

  const handleAddMenuItem = (menuItem) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.menuItem._id === menuItem._id);
      if (existing) {
        return prev.map(item =>
          item.menuItem._id === menuItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          menuItem: menuItem,
          quantity: 1,
          specialInstructions: ''
        }];
      }
    });
  };

  const handleUpdateItemQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.menuItem._id !== menuItemId));
    } else {
      setOrderItems(prev => prev.map(item =>
        item.menuItem._id === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleSubmitOrder = () => {
    if (!selectedTable || !selectedTable._id) {
      toast.error('Please select a valid table');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate order items
    for (const item of orderItems) {
      if (!item.menuItem || !item.menuItem._id) {
        toast.error('Invalid menu item in order');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error('Invalid quantity for menu item');
        return;
      }
    }

    const orderData = {
      tableId: selectedTable._id,
      items: orderItems.map(item => ({
        menuItemId: item.menuItem._id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      })),
      customer: {
        name: customerInfo.name || 'Walk-in Customer',
        phone: customerInfo.phone || '',
        email: customerInfo.email || ''
      },
      orderType: 'dine_in',
      notes: orderNotes || '',
      discount: 0
    };

    console.log('Submitting order with data:', orderData);
    console.log('Selected table:', selectedTable);
    console.log('Order items:', orderItems);
    
    createOrderMutation.mutate(orderData);
  };

  useEffect(() => {
    if (orders.length > 0) {
      devLog('Orders loaded:', orders);
    }
  }, [orders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      served: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.table?.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-medium">Error loading orders:</span> {error?.message || 'Failed to fetch orders'}
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
      {(isDetailsModalOpen || isDeleteModalOpen || isCreateOrderModalOpen) && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track all restaurant orders</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={handleCreateOrder}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </button>
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline flex items-center cursor-pointer"
            title="Refresh orders"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.waiter?.name || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{typeof order.table === 'object' ? order.table?.number : 'N/A'}</div>
                      <div className="text-sm text-gray-500 capitalize">{typeof order.table === 'object' ? order.table?.location : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer?.name || 'Walk-in'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                      <div className="text-sm text-gray-500">
                        {order.items?.slice(0, 2).map(item => item.menuItem?.name || 'Item').join(', ') || ''}
                        {order.items?.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTime(order.createdAt)}</div>
                      {order.estimatedPrepTime && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {order.estimatedPrepTime}m
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-primary-600 hover:text-primary-900 cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'confirmed')}
                            disabled={updateOrderStatusMutation.isPending}
                            className="text-green-600 hover:text-green-900 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Confirm Order"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'served')}
                            disabled={updateOrderStatusMutation.isPending}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark as Served"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.paymentStatus === 'pending' && order.status === 'served' && (
                          <button
                            onClick={() => handlePaymentStatusChange(order._id, 'paid')}
                            disabled={updatePaymentStatusMutation.isPending}
                            className="text-green-600 hover:text-green-900 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Process Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        
                        {['pending', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'cancelled')}
                            disabled={updateOrderStatusMutation.isPending}
                            className="text-red-600 hover:text-red-900 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cancel Order"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="text-red-600 hover:text-red-900 cursor-pointer transition-colors"
                          title="Delete Order"
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
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Modal header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-primary-600" />
                    Order Details
                  </h3>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="bg-white px-4 py-5 sm:p-6 space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Order Number</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Table</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      #{typeof selectedOrder.table === 'object' ? selectedOrder.table?.number : selectedOrder.table}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Customer</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedOrder.customer?.name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Waiter</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedOrder.waiter?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Payment Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-3">Order Items</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {typeof item === 'object' && item.menuItem ? item.menuItem.name : item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 ml-2 whitespace-nowrap">
                          {formatCurrency(item.total || item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                    </div>
                    {selectedOrder.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedOrder.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="btn-primary w-full sm:w-auto sm:ml-3 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Modal header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                    Delete Order
                  </h3>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="bg-white px-4 py-5 sm:p-6">
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete order <span className="font-bold">{selectedOrder.orderNumber}</span>? 
                  This action cannot be undone.
                </p>
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Table:</span> #{typeof selectedOrder.table === 'object' ? selectedOrder.table?.number : selectedOrder.table}
                  </p>
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Total:</span> {formatCurrency(selectedOrder.total)}
                  </p>
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Status:</span> {selectedOrder.status}
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteOrderMutation.isPending}
                  className="btn-danger w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteOrderMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteOrderMutation.isPending}
                  className="btn-outline w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-primary-600" />
                    Create New Order
                  </h3>
                  <button
                    onClick={() => setIsCreateOrderModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="bg-white px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Table and Customer Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Table *
                      </label>
                      <select
                        value={selectedTable?._id || ''}
                        onChange={(e) => {
                          const table = tables.find(t => t._id === e.target.value);
                          setSelectedTable(table);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">
                          {tablesError ? 'Error loading tables' : 'Choose a table...'}
                        </option>
                        {tables.filter(table => table.status === 'available').map(table => (
                          <option key={table._id} value={table._id}>
                            Table #{table.number} - {table.location} ({table.capacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Information
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Customer name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Notes
                      </label>
                      <textarea
                        placeholder="Special instructions or notes..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Right Column - Menu Items */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Menu Items
                      </label>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                        {menuError ? (
                          <div className="p-4 text-center text-red-500">
                            <p>Error loading menu items</p>
                            <p className="text-sm">{menuError.message}</p>
                          </div>
                        ) : menuItems.filter(item => item.isAvailable).length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <p>No menu items available</p>
                            <p className="text-sm">Please add menu items in the Menu management section</p>
                          </div>
                        ) : (
                          menuItems.filter(item => item.isAvailable).map(item => (
                            <div key={item._id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                              </div>
                              <button
                                onClick={() => handleAddMenuItem(item)}
                                className="btn-primary text-xs px-3 py-1"
                              >
                                Add
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.menuItem._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900">{item.menuItem.name}</h5>
                            <p className="text-sm text-gray-500">{formatCurrency(item.menuItem.price)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateItemQuantity(item.menuItem._id, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-xs"
                            >
                              -
                            </button>
                            <span className="font-medium text-gray-900 min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQuantity(item.menuItem._id, item.quantity + 1)}
                              className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(orderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={handleSubmitOrder}
                  disabled={createOrderMutation.isPending || !selectedTable || orderItems.length === 0}
                  className="btn-primary w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOrderMutation.isPending ? 'Creating Order...' : 'Create Order'}
                </button>
                <button
                  onClick={() => setIsCreateOrderModalOpen(false)}
                  disabled={createOrderMutation.isPending}
                  className="btn-outline w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
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

export default Orders;

