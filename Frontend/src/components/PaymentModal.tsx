import React, { useState } from 'react';
import { X, CreditCard, Lock, Calendar, User, MapPin, Clock } from 'lucide-react';
import { getToken } from '../utils/auth';
import { bookingAlerts, enhancedBookingAlerts } from '../utils/sweetAlert';

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  owner_name: string;
}

interface PaymentModalProps {
  court: Court;
  facility: Facility;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  totalHours: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  court,
  facility,
  bookingDate,
  startTime,
  endTime,
  totalAmount,
  totalHours,
  onClose,
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateCardDetails = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        newErrors.cvv = 'Please enter a valid CVV';
      }
      if (!cardDetails.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
      if (!cardDetails.billingAddress.trim()) {
        newErrors.billingAddress = 'Billing address is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const processPayment = async () => {
    if (paymentMethod === 'card' && !validateCardDetails()) {
      return false;
    }

    // Simulate payment processing
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (paymentMethod === 'card') {
        // Simulate card validation
        const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
        if (cardNumber.startsWith('4000000000000002')) {
          throw new Error('Card declined - Insufficient funds');
        }
        if (cardNumber.startsWith('4000000000000069')) {
          throw new Error('Card expired');
        }
        if (cardNumber.startsWith('4000000000000127')) {
          throw new Error('Invalid CVV');
        }
      }
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      // Process payment first
      enhancedBookingAlerts.processingPayment();
      await processPayment();
      enhancedBookingAlerts.paymentSuccess();
      
      // Create booking
      const token = getToken();
      if (!token) {
        enhancedBookingAlerts.loginRequired();
        return;
      }

      const response = await fetch('http://localhost:5000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: court.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          payment_method: paymentMethod,
          payment_amount: totalAmount,
          notes: `Paid via ${paymentMethod === 'card' ? 'Credit Card' : 'Cash'}`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        bookingAlerts.error(data.error || 'Booking failed');
        return;
      }

      // Success!
      enhancedBookingAlerts.bookingConfirmed();
      onSuccess();
      
    } catch (error: any) {
      if (error.message.includes('payment')) {
        enhancedBookingAlerts.paymentFailed(error.message);
      } else {
        bookingAlerts.error(error.message || 'Booking failed. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const hour = parseInt(timeString.split(':')[0]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-deep-navy">Complete Your Booking</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close payment form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="p-6 bg-sky-mist">
          <h3 className="text-lg font-semibold text-deep-navy mb-4">Booking Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center text-deep-navy">
                <MapPin className="h-4 w-4 mr-2" />
                <span><strong>Facility:</strong> {facility.name}</span>
              </div>
              <div className="flex items-center text-deep-navy">
                <User className="h-4 w-4 mr-2" />
                <span><strong>Court:</strong> {court.name} ({court.sport_type})</span>
              </div>
              <div className="flex items-center text-deep-navy">
                <Calendar className="h-4 w-4 mr-2" />
                <span><strong>Date:</strong> {formatDate(bookingDate)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-deep-navy">
                <Clock className="h-4 w-4 mr-2" />
                <span><strong>Time:</strong> {formatTime(startTime)} - {formatTime(endTime)}</span>
              </div>
              <div className="flex items-center text-deep-navy">
                <span><strong>Duration:</strong> {totalHours} hour{totalHours > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center text-deep-navy">
                <CreditCard className="h-4 w-4 mr-2" />
                <span><strong>Total Amount:</strong> ₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-deep-navy mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'card'
                  ? 'border-ocean-teal bg-ocean-teal/10'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-ocean-teal" />
              <div className="text-sm font-medium">Credit/Debit Card</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'cash'
                  ? 'border-ocean-teal bg-ocean-teal/10'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="h-6 w-6 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">₹</span>
              </div>
              <div className="text-sm font-medium">Pay at Venue</div>
            </button>
          </div>

          {/* Card Details Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Lock className="h-4 w-4 mr-2" />
                Your payment information is secure and encrypted
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Card Number *
                </label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="text"
                    value={cardDetails.expiryDate}
                    onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  value={cardDetails.cardholderName}
                  onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Billing Address *
                </label>
                <textarea
                  value={cardDetails.billingAddress}
                  onChange={(e) => handleCardInputChange('billingAddress', e.target.value)}
                  placeholder="Enter your billing address"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors resize-none ${
                    errors.billingAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.billingAddress && <p className="text-red-500 text-sm mt-1">{errors.billingAddress}</p>}
              </div>
            </div>
          )}

          {/* Cash Payment Info */}
          {paymentMethod === 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Pay at Venue</h4>
              <p className="text-sm text-yellow-700">
                You can pay ₹{totalAmount} directly at {facility.name} when you arrive for your booking.
                Please arrive 10 minutes early to complete the payment process.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBooking}
            disabled={loading}
            className="flex-1 bg-ocean-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Confirm Booking - ₹${totalAmount}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};