import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Mail, CheckCircle } from 'lucide-react';

interface PendingConfirmationProps {
  bookingReference: string;
  email: string;
  onBackToHome: () => void;
}

export function PendingConfirmation({ bookingReference, email, onBackToHome }: PendingConfirmationProps) {
  return (
    <Card className="bg-black/50 backdrop-blur-md border-yellow-500/30 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-yellow-400 text-center flex items-center justify-center gap-2">
          <Clock className="w-6 h-6 animate-pulse" />
          Payment Verification Pending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation */}
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="w-32 h-32 border-8 border-yellow-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-32 h-32 border-8 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Mail className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">
            Thank You for Your Payment!
          </h3>
          <p className="text-gray-300">
            Your booking reference is: <span className="text-pink-400 font-bold">{bookingReference}</span>
          </p>
          <p className="text-gray-300">
            We are currently reviewing your payment proof. You will receive a confirmation email at:
          </p>
          <p className="text-blue-400 font-semibold text-lg">{email}</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="text-white font-semibold">What happens next?</p>
              <ul className="text-white text-sm space-y-2 list-disc list-inside">
                <li>Our admin will verify your payment proof</li>
                <li>This usually takes 5-30 minutes</li>
                <li>You'll receive a confirmation email once approved</li>
                <li>Check your spam folder if you don't see it</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm text-center">
            <strong>Important:</strong> Please do not close this page until you receive the confirmation email. 
            If you don't receive an email within 1 hour, contact us at{' '}
            <a href="mailto:wallstreet.sportz@gmail.com" className="underline">
              wallstreet.sportz@gmail.com
            </a>
          </p>
        </div>

        {/* Button */}
        <div className="text-center pt-6">
          <Button
            onClick={onBackToHome}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8"
          >
            Back to Home
          </Button>
        </div>

        {/* Contact Info */}
        <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
          <p>Need help? Contact us:</p>
          <p className="text-gray-300 mt-1">
            Email: wallstreet.sportz@gmail.com
          </p>
        </div>
      </CardContent>
    </Card>
  );
}