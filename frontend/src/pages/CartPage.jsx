import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      // 1. Fetch cart items
      const cartRes = await api.get(`/cart/${user.id}`);
      const cartData = cartRes.data?.items || [];
      
      // 2. Fetch full product details from catalog for the items in the cart
      // (Since cart service only stores productId and priceSnapshot)
      if (cartData.length > 0) {
        const productsRes = await api.get('/catalog/products');
        const allProducts = productsRes.data;
        
        // Merge product details into cart items
        const mergedItems = cartData.map(item => {
          const productDetail = allProducts.find(p => p.id === item.productId);
          return {
            ...item,
            product: productDetail || { 
              id: item.productId, 
              name: 'Unknown Product', 
              price: item.priceSnapshot,
              imageUrl: `https://picsum.photos/seed/${item.productId}/400/400`
            }
          };
        });
        setCartItems(mergedItems);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user.id]);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await api.put(`/cart/${user.id}/items/${productId}`, {
        quantity: newQuantity
      });
      fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${user.id}/items/${productId}`);
      toast.success('Item removed');
      fetchCart();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) return <div className="text-center py-20">Loading cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/" className="inline-block bg-brand-600 text-white px-6 py-3 rounded-md font-medium hover:bg-brand-700">
          Start Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item.id} className="p-6 flex py-6">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.product.imageUrl || `https://picsum.photos/seed/${item.product.id}/400/400`}
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.product.name}</h3>
                        <p className="ml-4">₹{item.product.price * item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >-</button>
                        <span className="px-3 py-1 border-x border-gray-300">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >+</button>
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="font-medium text-red-600 hover:text-red-500 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order summary</h2>
            <div className="flow-root">
              <dl className="-my-4 divide-y divide-gray-200 text-sm">
                <div className="flex items-center justify-between py-4">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">₹{subtotal}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium text-gray-900">Free</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-base font-bold text-gray-900">Order total</dt>
                  <dd className="text-base font-bold text-gray-900">₹{subtotal}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;