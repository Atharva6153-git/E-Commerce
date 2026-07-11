import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, TrendingUp, Zap } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart: addItemToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/catalog/products')
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load products');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      toast('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      await addItemToCart(productId, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 rounded-2xl shadow-2xl mb-12 overflow-hidden">
        <div className="px-8 py-16 md:px-16 md:py-20 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-6 w-6 text-yellow-300" />
              <span className="text-yellow-300 font-semibold uppercase tracking-wide text-sm">New Arrivals</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Discover Your Perfect Style
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-brand-50 leading-relaxed">
              Premium quality products at unbeatable prices. Shop the latest trends and exclusive collections.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                className="bg-white text-brand-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Shop Now
              </button>
              <button 
                onClick={() => {
                  toast.success('Special deals coming soon! 🎉');
                }}
                className="bg-brand-700 bg-opacity-50 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-opacity-70 transition-all border-2 border-white border-opacity-30"
              >
                View Deals
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="bg-black bg-opacity-20 backdrop-blur-md border-t border-white border-opacity-30">
          <div className="grid grid-cols-3 divide-x divide-white divide-opacity-30">
            <div className="px-6 py-5 text-center">
              <p className="text-3xl font-bold text-white drop-shadow-lg">{products.length}+</p>
              <p className="text-white text-sm font-semibold mt-1 drop-shadow">Products</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-3xl font-bold text-white drop-shadow-lg">10K+</p>
              <p className="text-white text-sm font-semibold mt-1 drop-shadow">Happy Customers</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-3xl font-bold text-white drop-shadow-lg">4.9★</p>
              <p className="text-white text-sm font-semibold mt-1 drop-shadow">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-brand-600" />
            Trending Products
          </h2>
          <p className="mt-2 text-gray-600">Handpicked items just for you</p>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div 
            key={product.id} 
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-brand-200 transform hover:-translate-y-2"
          >
            <Link to={`/product/${product.id}`} className="block relative">
              <div className="relative overflow-hidden bg-gray-100 aspect-square">
                <img
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${product.id}/400/400`;
                  }}
                />
                <div className="absolute top-3 right-3 bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  NEW
                </div>
              </div>
            </Link>
            
            <div className="p-5">
              <Link to={`/product/${product.id}`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
              </Link>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="ml-1 font-semibold">4.5</span>
                </div>
              </div>
              
              <button
                onClick={() => handleAddToCart(product.id)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3 rounded-lg font-semibold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md hover:shadow-lg transform active:scale-95"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;