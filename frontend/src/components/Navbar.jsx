import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch initial cart count
      api.get(`/cart/${user.id}`)
        .then(res => {
          if (res.data && res.data.items) {
            setCartCount(res.data.items.length);
          }
        })
        .catch(err => console.error("Error fetching cart count", err));
    } else {
      setCartCount(0);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-brand-600" />
            <span className="text-xl font-bold text-gray-900">E-ShopX</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/cart" className="relative text-gray-600 hover:text-brand-600 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                
                <div className="group relative cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold uppercase">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="font-medium hidden sm:block">{user?.name || user?.email?.split('@')[0]}</span>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block border border-gray-100">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      Signed in as<br/>
                      <span className="font-medium text-gray-900 truncate">{user.email}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium">Log in</Link>
                <Link to="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium transition-colors">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
