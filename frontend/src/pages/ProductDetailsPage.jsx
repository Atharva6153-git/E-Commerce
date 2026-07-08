import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/catalog/products/${id}`)
      .then(res => {
        setProduct(res.data);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load product details');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const addToCart = async () => {
    if (!user) {
      toast('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-brand-600 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to shopping
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-8 border-r border-gray-100">
          <img
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
            alt={product.name}
            className="max-w-full h-auto object-contain max-h-[500px] rounded-lg shadow-md"
          />
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-2xl font-semibold text-brand-600 mb-6">₹{product.price}</p>
            
            <div className="prose prose-sm text-gray-600 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex items-center mb-6">
              <span className="mr-4 text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                >-</button>
                <span className="px-6 py-2 border-x border-gray-300 font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                >+</button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={addToCart}
                className="flex-1 flex items-center justify-center py-4 px-6 rounded-lg text-white bg-brand-600 hover:bg-brand-700 font-medium shadow-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
