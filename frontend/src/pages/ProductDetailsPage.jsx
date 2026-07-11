import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Loader2, Star, Shield, Truck, Package } from 'lucide-react';
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
  const { addToCart: addItemToCart } = useCart();
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

  const handleAddToCart = async () => {
    if (!user) {
      toast('Please log in to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addItemToCart(product.id, quantity);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-brand-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to products</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
            <div className="sticky top-8">
              <img
                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
                alt={product.name}
                className="w-full h-auto object-contain rounded-xl shadow-2xl"
                onError={(e) => {
                  e.target.src = `https://picsum.photos/seed/${product.id}/600/600`;
                }}
              />
              <div className="absolute top-4 left-4 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Premium Quality
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-8 lg:p-12">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">4.8 (256 reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-brand-600">₹{product.price}</span>
                <span className="text-xl text-gray-400 line-through">₹{Math.round(product.price * 1.3)}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  23% OFF
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Product Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'Premium quality product with exceptional craftsmanship. Experience luxury and style with every use.'}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-brand-50 rounded-xl">
                <Truck className="h-6 w-6 text-brand-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Free Shipping</p>
              </div>
              <div className="text-center p-4 bg-brand-50 rounded-xl">
                <Shield className="h-6 w-6 text-brand-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Secure Payment</p>
              </div>
              <div className="text-center p-4 bg-brand-50 rounded-xl">
                <Package className="h-6 w-6 text-brand-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Easy Returns</p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-3">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-5 py-3 text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="px-8 py-3 border-x-2 border-gray-300 font-bold text-lg min-w-[80px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-5 py-3 text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  <span className="font-semibold text-green-600">In Stock</span> - Ready to ship
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <ShoppingCart className="h-6 w-6" />
                Add to Cart
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500 text-center">
              🔒 Secure checkout • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
