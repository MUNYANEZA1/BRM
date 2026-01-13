import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Search, Filter, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CustomerMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [tableId, setTableId] = useState(null);

  // Extract table ID from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get('table');
    setTableId(table);
  }, [location]);

  // Mock data
  const categories = [
    { id: 'all', name: 'All Items', icon: '🍽️' },
    { id: 'appetizers', name: 'Appetizers', icon: '🥗' },
    { id: 'main_courses', name: 'Main Courses', icon: '🍖' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
  ];

  const menuItems = [
    {
      id: 1,
      name: 'Grilled Chicken Breast',
      description: 'Tender grilled chicken breast served with seasonal vegetables and herb butter',
      category: 'main_courses',
      price: 8000,
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 25,
      allergens: ['gluten'],
      tags: ['protein', 'healthy', 'popular']
    },
    {
      id: 2,
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan cheese',
      category: 'appetizers',
      price: 6000,
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 10,
      allergens: ['dairy', 'eggs'],
      tags: ['vegetarian', 'fresh']
    },
    {
      id: 3,
      name: 'Beef Burger',
      description: 'Juicy beef patty with lettuce, tomato, onion, and special sauce on a brioche bun',
      category: 'main_courses',
      price: 12000,
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 20,
      allergens: ['gluten', 'dairy'],
      tags: ['popular', 'comfort food']
    },
    {
      id: 4,
      name: 'Coca Cola',
      description: 'Classic refreshing cola drink served ice cold',
      category: 'beverages',
      price: 1500,
      image: '/api/placeholder/300/200',
      isAvailable: false,
      preparationTime: 1,
      allergens: [],
      tags: ['cold', 'refreshing']
    },
    {
      id: 5,
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with chocolate ganache and fresh berries',
      category: 'desserts',
      price: 4500,
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 5,
      allergens: ['dairy', 'eggs', 'gluten'],
      tags: ['sweet', 'popular']
    },
    {
      id: 6,
      name: 'Fish & Chips',
      description: 'Beer-battered fish with crispy fries and tartar sauce',
      category: 'main_courses',
      price: 10000,
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 18,
      allergens: ['gluten', 'fish'],
      tags: ['crispy', 'comfort food']
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, cartItem) => {
        if (cartItem.id === itemId) {
          if (cartItem.quantity > 1) {
            acc.push({ ...cartItem, quantity: cartItem.quantity - 1 });
          }
        } else {
          acc.push(cartItem);
        }
        return acc;
      }, []);
    });
  };

  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">The Golden Fork</span>
              {tableId && (
                <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  📍 Table ID: {tableId.substring(0, 8)}...
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="text-sm text-gray-700">
                    Welcome, <span className="font-semibold">{user?.name || 'Guest'}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Register
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filter */}
            <div className="mb-8">
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
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const quantity = getCartItemQuantity(item.id);
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      {item.tags.includes('popular') && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="absolute top-2 right-2 bg-white text-gray-700 text-xs px-2 py-1 rounded-full">
                        {item.preparationTime} min
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      
                      {item.allergens.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">
                            Contains: {item.allergens.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </span>
                        
                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="btn-primary flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm">Try adjusting your search or category filter</p>
                </div>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <div className="lg:w-80">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Order</h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-medium text-gray-900 min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(getCartTotal())}
                        </span>
                      </div>
                      
                      {isAuthenticated ? (
                        <button className="btn-primary w-full">
                          Place Order
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/login')}
                          className="btn-primary w-full"
                        >
                          Login to Order
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerMenu;

