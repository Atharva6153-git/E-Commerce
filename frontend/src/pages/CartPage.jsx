import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, loading, updateQuantity, removeItem } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mergeCartItems = async () => {
      if (!items.length) {
        setCartItems([]);
        return;
      }

      try {
        const productsRes = await api.get('/catalog/products');
        const allProducts = productsRes.data;

        const mergedItems = items.map((item) => {
          const productDetail = allProducts.find((p) => p.id === item.productId);
          return {
            ...item,
            product: productDetail || {
              id: item.productId,
              name: 'Unknown Product',
              price: item.priceSnapshot,
              imageUrl: `https://picsum.photos/seed/${item.productId}/400/400`,
            },
          };
        });
        setCartItems(mergedItems);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load product details');
      }
    };

    mergeCartItems();
  }, [items]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(productId, newQuantity);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeItem(productId);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-16 w-16 text-brand-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-600 mb-8 text-lg">Start shopping and add items to your cart!</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Start Shopping
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 0;
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal + shipping - discount;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingBag className="h-10 w-10 text-brand-600" />
          Shopping Cart
        </h1>
        <p className="mt-2 text-gray-600 text-lg">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.imageUrl || `https://picsum.photos/seed/${item.product.id}/400/400`}
                        alt={item.product.name}
                        className="w-32 h-32 object-cover rounded-xl shadow-md border border-gray-200"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{item.product.name}</h3>
                          <p className="text-brand-600 font-semibold text-lg">₹{item.product.price}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors h-fit"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            className="px-4 py-2 text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="px-6 py-2 border-x-2 border-gray-300 font-bold min-w-[60px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="px-4 py-2 text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-2xl font-bold text-gray-900">₹{item.product.price * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl shadow-2xl p-8 text-white sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-brand-50">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-brand-50">
                <span>Shipping</span>
                <span className="font-semibold text-green-300">Free</span>
              </div>
              <div className="flex justify-between text-green-300">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Discount (5%)
                </span>
                <span className="font-semibold">-₹{discount}</span>
              </div>
              <div className="border-t border-brand-400 pt-4 mt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-white text-brand-600 py-4 rounded-xl font-bold text-lg hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-brand-100 text-sm text-center mt-4">
              🔒 Secure checkout guaranteed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
