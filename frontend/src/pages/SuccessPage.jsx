import React from 'react';
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

export default SuccessPage;