import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
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

  const addToCart = async (productId) => {
    if (!user) {
      toast('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      await addToCart(productId, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading products...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Featured Products</h1>
        <p className="mt-2 text-gray-600">Discover our latest collection of premium items.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/product/${product.id}`} className="block group">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                <img
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
                  alt={product.name}
                  className="h-64 w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
            </Link>
            <div className="p-4">
              <Link to={`/product/${product.id}`}>
                <h3 className="text-lg font-medium text-gray-900 truncate hover:text-brand-600 transition-colors">{product.name}</h3>
              </Link>
              <p className="mt-1 text-sm text-gray-500 h-10 overflow-hidden">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                <button
                  onClick={() => addToCart(product.id)}
                  className="flex items-center justify-center p-2 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                  title="Add to cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;