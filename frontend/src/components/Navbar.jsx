import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, Store, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 shadow-lg sticky top-0 z-50 border-b border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-white p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
              <Store className="h-7 w-7 text-brand-600" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">ShopHub</span>
              <p className="text-xs text-brand-100 -mt-1">Premium Shopping</p>
            </div>
          </Link>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart */}
                <Link 
                  to="/cart" 
                  className={`relative p-3 rounded-lg transition-all ${
                    isActive('/cart') 
                      ? 'bg-white text-brand-600 shadow-md' 
                      : 'text-white hover:bg-brand-500'
                  }`}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* User Profile */}
                <div className="flex items-center space-x-3 bg-brand-500 bg-opacity-50 px-4 py-2 rounded-lg border border-brand-400">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {user?.name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-brand-100">{user?.email}</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-white hover:text-brand-100 font-medium px-4 py-2 rounded-lg hover:bg-brand-500 transition-all"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-white text-brand-600 hover:bg-brand-50 px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
