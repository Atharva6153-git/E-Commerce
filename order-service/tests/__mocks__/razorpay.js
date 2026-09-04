/**
 * Controllable fake Razorpay SDK, mapped via jest.config moduleNameMapper so
 * the in-process Payment service uses it instead of the real `razorpay` npm
 * package (which is only installed in payment-service and would hit the real
 * api.razorpay.com network).
 *
 * `orders.create` is a jest.fn() that tests can drive for success/failure.
 */
const ordersCreate = jest.fn();

class MockRazorpay {
  constructor() {
    this.orders = { create: ordersCreate };
  }
}

MockRazorpay.__ordersCreate = ordersCreate;

module.exports = MockRazorpay;
