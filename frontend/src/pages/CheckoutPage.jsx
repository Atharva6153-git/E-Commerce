import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (window.Razorpay) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const res = await api.get(`/cart/${user.id}`);
        if (!res.data || res.data.items.length === 0) {
          navigate('/cart');
          return;
        }
        
        const cartData = res.data.items;
        // Fetch full product details from catalog for the items
        const productsRes = await api.get('/catalog/products');
        const allProducts = productsRes.data;
        
        const mergedItems = cartData.map(item => {
          const productDetail = allProducts.find(p => p.id === item.productId);
          return {
            ...item,
            product: productDetail || { 
              id: item.productId, 
              name: 'Unknown Product', 
              price: item.priceSnapshot,
              imageUrl: `https://picsum.photos/seed/${item.productId}/200/200`
            }
          };
        });
        
        setCartItems(mergedItems);
      } catch (err) {
        toast.error('Failed to load checkout details');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
    loadRazorpayScript().catch(() => {
      // Preload in background; handlePayment will retry if this fails
    });
  }, [user.id, navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await loadRazorpayScript();

      // 1. Initiate checkout (creates order, reserves stock, creates Razorpay order)
      const checkoutRes = await api.post('/orders/checkout', { userId: String(user.id) });
      const { order, payment } = checkoutRes.data;

      if (!payment?.keyId || !payment?.razorpayOrderId) {
        throw new Error('Payment details missing from server response');
      }

      // 2. Open Razorpay UI
      const options = {
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'E-ShopX',
        description: 'Order Checkout',
        order_id: payment.razorpayOrderId,
        handler: async function (response) {
          try {
            // 3. Complete order
            await api.post(`/orders/${order.id}/complete`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
            });

            navigate(`/success?orderId=${order.id}`);
          } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Payment verification failed');
            console.error(err);
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: user.name || user.email?.split('@')[0],
          email: user.email,
        },
        theme: { color: '#4f46e5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate payment';
      toast.error(message);
      console.error(err);
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Review your order</h2>
        </div>
        <div className="p-6">
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="py-4 flex justify-between">
                <div className="flex">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.product.imageUrl || `https://picsum.photos/seed/${item.product.id}/200/200`}
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">₹{item.product.price * item.quantity}</p>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-gray-200 flex justify-between">
            <span className="font-bold text-gray-900">Total to pay:</span>
            <span className="font-bold text-brand-600 text-xl">₹{subtotal}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={processing}
        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Pay Securely with Razorpay'}
      </button>
    </div>
  );
};

export default CheckoutPage;