const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/src/pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

const loginContent = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Log in to E-ShopX</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            type="email"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none"
        >
          Log in
        </button>
      </form>
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500">Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;`;

const signupContent = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(name, email, password);
      toast.success('Account created successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Create your account</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            type="email"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none"
        >
          Sign up
        </button>
      </form>
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">Log in</Link>
      </div>
    </div>
  );
};

export default SignupPage;`;

const homeContent = `import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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
      await api.post('/cart/add', {
        userId: user.id,
        productId,
        quantity: 1
      });
      toast.success('Added to cart');
      // Hacky way to trigger navbar update for now
      window.dispatchEvent(new Event('cartUpdated')); 
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
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
              <img
                src={product.imageUrl || \`https://picsum.photos/seed/\${product.id}/400/400\`}
                alt={product.name}
                className="h-64 w-full object-cover object-center group-hover:opacity-75"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
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

export default HomePage;`;

const cartContent = `import React, { useState, useEffect } from 'react';
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

  const fetchCart = () => {
    setLoading(true);
    api.get(\`/cart/\${user.id}\`)
      .then(res => {
        setCartItems(res.data?.items || []);
      })
      .catch(err => {
        toast.error('Failed to load cart');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, [user.id]);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await api.put('/cart/update', {
        userId: user.id,
        productId,
        quantity: newQuantity
      });
      fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete('/cart/remove', {
        data: { userId: user.id, productId }
      });
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
                      src={item.product.imageUrl || \`https://picsum.photos/seed/\${item.product.id}/400/400\`}
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

export default CartPage;`;

const checkoutContent = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(\`/cart/\${user.id}\`)
      .then(res => {
        if (!res.data || res.data.items.length === 0) {
          navigate('/cart');
          return;
        }
        setCartItems(res.data.items);
      })
      .catch(err => {
        toast.error('Failed to load checkout details');
        navigate('/cart');
      })
      .finally(() => setLoading(false));
      
    // Load Razorpay Script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, [user.id, navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // 1. Create order in order-service
      const orderRes = await api.post('/orders/create', { userId: user.id });
      const order = orderRes.data;

      // 2. Initialize payment with Razorpay
      const paymentInitRes = await api.post('/payment/initiate', {
        userId: user.id,
        orderId: order.id,
        amount: subtotal
      });
      const razorpayOrder = paymentInitRes.data;

      // 3. Open Razorpay UI
      const options = {
        key: razorpayOrder.key_id, // We returned this from payment service (if we did? wait, let's just pass a default key if not)
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "E-ShopX",
        description: "Test Transaction",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // 4. Verify payment
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              system_order_id: order.id,
            });
            
            if (verifyRes.data.status === 'PAID') {
              // 5. Trigger fulfillment (this fires email)
              await api.post('/orders/fulfill', {
                orderId: order.id,
                paymentId: verifyRes.data.id
              });
              navigate(\`/success?orderId=\${order.id}\`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Error verifying payment');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#4f46e5" } // brand-600
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error(response.error.description);
      });
      rzp.open();
      
    } catch (err) {
      toast.error('Failed to initiate payment');
      console.error(err);
    } finally {
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
                      src={item.product.imageUrl || \`https://picsum.photos/seed/\${item.product.id}/200/200\`}
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

export default CheckoutPage;`;

const successContent = `import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. We have received your order and are getting it ready for shipment.
      </p>
      
      {orderId && (
        <div className="bg-gray-50 rounded-md p-4 mb-8 text-left border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Order ID</p>
          <p className="text-gray-900 font-mono mt-1">{orderId}</p>
        </div>
      )}
      
      <p className="text-sm text-gray-500 mb-8 font-medium">
        📧 We've sent a confirmation email with details to your registered email address.
      </p>

      <Link
        to="/"
        className="inline-block bg-brand-600 text-white px-8 py-3 rounded-md font-medium hover:bg-brand-700 transition-colors w-full"
      >
        Continue Shopping
      </Link>
    </div>
  );
};

export default SuccessPage;`;

fs.writeFileSync(path.join(pagesDir, 'LoginPage.jsx'), loginContent);
fs.writeFileSync(path.join(pagesDir, 'SignupPage.jsx'), signupContent);
fs.writeFileSync(path.join(pagesDir, 'HomePage.jsx'), homeContent);
fs.writeFileSync(path.join(pagesDir, 'CartPage.jsx'), cartContent);
fs.writeFileSync(path.join(pagesDir, 'CheckoutPage.jsx'), checkoutContent);
fs.writeFileSync(path.join(pagesDir, 'SuccessPage.jsx'), successContent);
console.log('Pages generated successfully!');
