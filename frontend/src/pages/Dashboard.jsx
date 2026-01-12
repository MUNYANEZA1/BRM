import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw
} from 'lucide-react';
import { tablesAPI, ordersAPI, inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    totalTables: 0,
    occupiedTables: 0,
    lowStockItems: 0,
  });

  // Fetch tables data
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await tablesAPI.getTables({ limit: 100 });
      return response.data.data.tables || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch orders data
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersAPI.getOrders({ limit: 100 });
      return response.data.data.orders || [];
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryAPI.getInventoryItems({ limit: 100 });
      return response.data.data.inventoryItems || [];
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Calculate stats from real data
  useEffect(() => {
    if (tablesData && ordersData && inventoryData) {
      // Data is already extracted as arrays from API queryFn
      const tables = tablesData || [];
      const orders = ordersData || [];
      const inventory = inventoryData || [];

      // Calculate occupied tables
      const occupiedCount = tables.filter(t => t.status === 'occupied').length;
      
      // Calculate order stats
      const activeOrdersCount = orders.filter(o => 
        ['pending', 'preparing', 'ready'].includes(o.status)
      ).length;
      
      const todayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const todayOrdersCount = orders.filter(o =>
        new Date(o.createdAt).toDateString() === new Date().toDateString()
      ).length;

      // Calculate low stock items
      const lowStockCount = inventory.filter(item => 
        item.currentStock <= (item.minimumStock || 10)
      ).length;

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenue,
        activeOrders: activeOrdersCount,
        totalTables: tables.length,
        occupiedTables: occupiedCount,
        lowStockItems: lowStockCount,
      });
    }
  }, [tablesData, ordersData, inventoryData]);

  // Get recent orders
  const recentOrders = (() => {
    const orders = ordersData || [];
    return orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        table: order.table?.number ? `Table ${order.table.number}` : 'N/A',
        items: order.items?.length || 0,
        total: order.total || 0,
        status: order.status,
        time: getTimeAgo(order.createdAt),
      }));
  })();

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      served: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
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

  const isLoading = tablesLoading || ordersLoading || inventoryLoading;

  if (isLoading && !stats.totalTables) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Orders */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Occupancy */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Table Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.occupiedTables}/{stats.totalTables}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  {Math.round((stats.occupiedTables / stats.totalTables) * 100)}% occupied
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-600">Latest orders from your restaurant</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.table} • {order.items} items • {order.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/orders')}
                  className="btn-outline hover:opacity-90 transition cursor-pointer"
                >
                  View all orders
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {stats.lowStockItems > 0 ? (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Low Stock Alert</p>
                      <p className="text-xs text-red-700">{stats.lowStockItems} items running low</p>
                    </div>
                  </div>
                ) : null}
                
                {stats.activeOrders > 5 ? (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">High Activity</p>
                      <p className="text-xs text-yellow-700">{stats.activeOrders} orders being prepared</p>
                    </div>
                  </div>
                ) : null}

                {stats.occupiedTables > 0 ? (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Restaurant Status</p>
                      <p className="text-xs text-blue-700">{stats.occupiedTables} tables occupied</p>
                    </div>
                  </div>
                ) : null}

                {stats.lowStockItems === 0 && stats.activeOrders <= 5 ? (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">All Systems Normal</p>
                      <p className="text-xs text-green-700">Kitchen running smoothly</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/orders')}
                  className="btn-primary w-full flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Order
                </button>
                
                <button 
                  onClick={() => navigate('/inventory')}
                  className="btn-outline w-full flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Check Inventory
                </button>
                
                <button 
                  onClick={() => navigate('/tables')}
                  className="btn-outline w-full flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Tables
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

