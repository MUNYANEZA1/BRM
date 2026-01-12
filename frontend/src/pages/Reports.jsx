import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { ordersAPI, inventoryAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('sales');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch all orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersAPI.getOrders({ limit: 1000 });
      return response.data.data.orders || [];
    },
    refetchInterval: 30000,
  });

  // Fetch inventory items
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryAPI.getInventoryItems({ limit: 1000 });
      return response.data.data.inventoryItems || [];
    },
    refetchInterval: 60000,
  });

  // Fetch users for staff performance
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getUsers({ limit: 1000 });
      return response.data.data.users || [];
    },
    refetchInterval: 60000,
  });

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate = now;

    if (dateRange === 'custom') {
      startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
    }

    return { startDate, endDate };
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!ordersData) return [];
    const { startDate, endDate } = getDateRange();
    return (ordersData || []).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [ordersData, dateRange]);

  // Calculate sales data
  const salesData = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top selling items
    const itemSalesMap = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.menuItem?.name || 'Unknown Item';
        if (!itemSalesMap[itemName]) {
          itemSalesMap[itemName] = { quantity: 0, revenue: 0 };
        }
        itemSalesMap[itemName].quantity += item.quantity;
        itemSalesMap[itemName].revenue += item.totalPrice;
      });
    });

    const topSellingItems = Object.entries(itemSalesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topSellingItems,
    };
  }, [filteredOrders]);

  // Calculate inventory data
  const inventoryStats = useMemo(() => {
    if (!inventoryData) return { lowStockItems: [], expiringItems: [], totalValue: 0, lowStockCount: 0 };

    const lowStockItems = (inventoryData || []).filter(item => 
      item.currentStock <= (item.minimumStock || 10)
    );

    const expiringItems = (inventoryData || [])
      .filter(item => item.expiryDate)
      .map(item => ({
        ...item,
        expiryDate: new Date(item.expiryDate),
        daysLeft: Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
      .filter(item => item.daysLeft <= 7 && item.daysLeft > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);

    const totalValue = (inventoryData || []).reduce((sum, item) => 
      sum + ((item.unitCost || 0) * item.currentStock), 0
    );

    return {
      lowStockItems: lowStockItems.slice(0, 5),
      expiringItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiringCount: (inventoryData || []).filter(item => item.expiryDate && new Date(item.expiryDate) <= new Date()).length
    };
  }, [inventoryData]);

  // Calculate staff performance
  const staffStats = useMemo(() => {
    if (!filteredOrders) return { totalStaff: 0, activeStaff: 0, topPerformers: [] };

    const waiterOrders = {};
    filteredOrders.forEach(order => {
      if (order.waiter?._id) {
        const waiterId = order.waiter._id;
        if (!waiterOrders[waiterId]) {
          waiterOrders[waiterId] = {
            name: order.waiter.firstName + ' ' + order.waiter.lastName,
            ordersServed: 0,
            revenue: 0
          };
        }
        waiterOrders[waiterId].ordersServed += 1;
        waiterOrders[waiterId].revenue += order.total || 0;
      }
    });

    const topPerformers = Object.values(waiterOrders)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalStaff: (usersData || []).filter(u => u.role === 'waiter' || u.role === 'cashier').length,
      activeStaff: topPerformers.length,
      topPerformers
    };
  }, [filteredOrders, usersData]);

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString();
      const end = new Date(customEndDate).toLocaleDateString();
      return `${start} to ${end}`;
    }
    const labels = {
      today: 'Today',
      week: 'Last 7 Days',
      month: 'This Month'
    };
    return labels[dateRange] || 'Today';
  };

  const isLoading = ordersLoading || inventoryLoading || usersLoading;

  if (isLoading && !salesData.totalOrders) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track performance and analyze business metrics</p>
        </div>
        <button className="btn-primary flex items-center mt-4 sm:mt-0">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="input w-full"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={getTodayString()}
                      className="input w-full"
                    />
                  </div>
                  <div className="sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={getTodayString()}
                      className="input w-full"
                    />
                  </div>
                </>
              )}

              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="input w-full"
                >
                  <option value="sales">Sales Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="staff">Staff Performance</option>
                  <option value="financial">Financial Summary</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Report */}
      {reportType === 'sales' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.totalSales)}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {salesData.totalOrders > 0 ? 'Orders processed' : 'No sales yet'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.totalOrders}</p>
                    <p className="text-sm text-blue-600 flex items-center mt-1">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {getDateRangeLabel()}
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.averageOrderValue)}</p>
                    <p className="text-sm text-purple-600 flex items-center mt-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Per order
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          {salesData.topSellingItems.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Items - {getDateRangeLabel()}</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {salesData.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content text-center py-8">
                <p className="text-gray-600">No orders yet for this period</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(inventoryStats.totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStockCount}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-red-600">{inventoryStats.expiringCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inventoryStats.lowStockItems.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    {inventoryStats.lowStockItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Current: {item.currentStock} | Min: {item.minimumStock}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Low Stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                </div>
                <div className="card-content text-center py-8">
                  <p className="text-gray-600">All items are well stocked</p>
                </div>
              </div>
            )}

            {inventoryStats.expiringItems.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Expiring Items</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    {inventoryStats.expiringItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {item.daysLeft} days left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Expiring Items</h3>
                </div>
                <div className="card-content text-center py-8">
                  <p className="text-gray-600">No items expiring soon</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Staff Performance Report */}
      {reportType === 'staff' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{staffStats.totalStaff}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Active Performers</p>
                  <p className="text-2xl font-bold text-green-600">{staffStats.activeStaff}</p>
                </div>
              </div>
            </div>
          </div>

          {staffStats.topPerformers.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Top Performers - {getDateRangeLabel()}</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {staffStats.topPerformers.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-600">{staff.ordersServed} orders served</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(staff.revenue)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content text-center py-8">
                <p className="text-gray-600">No staff activity for this period</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Financial Summary */}
      {reportType === 'financial' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary - {getDateRangeLabel()}</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(salesData.totalSales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Tax (18%)</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(salesData.totalSales * 0.18)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(salesData.totalSales * 0.82)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{salesData.totalOrders}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

