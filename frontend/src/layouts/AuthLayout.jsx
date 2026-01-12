import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Bar & Restaurant
            </h1>
            <h2 className="text-3xl font-light mb-6">
              Management System
            </h2>
            <p className="text-xl opacity-90 max-w-md">
              Streamline your restaurant operations with our comprehensive management solution
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white opacity-10 rounded-full"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white opacity-10 rounded-full"></div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bar & Restaurant Management
            </h1>
            <p className="text-gray-600">
              Manage your restaurant efficiently
            </p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

