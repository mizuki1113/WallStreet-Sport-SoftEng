import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Clock, Check, CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAvailableSlots, useInitiatePayment, TimeSlot } from '../api/hooks';
import { QRCodePaymentModal } from './QRCodePaymentModal';
import { PendingConfirmation } from './PendingConfirmation';

interface BookingForm {
  name: string;
  contact: string;
  email: string;
  date: Date | undefined;
  // ✅ now supports multiple slots
  timeSlots: TimeSlot[];
  agreedToTerms: boolean;
}

export function BookingSection() {
  const [currentStep, setCurrentStep] = useState<
    'calendar' | 'form' | 'confirmation' | 'qr' | 'pending' | 'receipt'
  >('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: '',
    contact: '',
    email: '',
    date: undefined,
    timeSlots: [],
    agreedToTerms: false,
  });
  const [bookingReference, setBookingReference] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);

  // convert selected date to YYYY-MM-DD for API
  const dateStr = selectedDate
    ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })()
    : undefined;

  const {
    data: timeSlots = [],
    isLoading: loadingSlots,
    error: slotsError,
  } = useAvailableSlots(dateStr);
  const initiatePayment = useInitiatePayment();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setBookingForm(prev => ({
      ...prev,
      date,
      timeSlots: [], // reset selected slots when date changes
    }));
  };

  // ✅ toggle selection of a slot (multi-select)
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    setBookingForm(prev => {
      const exists = prev.timeSlots.some(s => s.time === slot.time);
      return {
        ...prev,
        timeSlots: exists
          ? prev.timeSlots.filter(s => s.time !== slot.time)
          : [...prev.timeSlots, slot],
      };
    });
  };

  const handleFormSubmit = () => {
    if (
      !bookingForm.name ||
      !bookingForm.contact ||
      !bookingForm.email ||
      !bookingForm.agreedToTerms
    ) {
      toast.error('Please fill in all required fields and agree to terms');
      return;
    }

    if (!bookingForm.timeSlots.length) {
      toast.error('Please select at least one time slot');
      return;
    }

    setCurrentStep('confirmation');
  };

  const handleConfirmBooking = async () => {
    const amount = bookingForm.timeSlots.reduce(
      (sum, slot) => sum + Number(slot.rate),
      0
    );
    setPaymentAmount(amount);

    const selectedDate = bookingForm.date!;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    try {
      const result = await initiatePayment.mutateAsync({
        amount,
        booking: {
          name: bookingForm.name,
          email: bookingForm.email,
          contact: bookingForm.contact,
          date: dateString,
          // ✅ send array of timeSlots as backend expects
          timeSlots: bookingForm.timeSlots.map(slot => ({
            time: slot.time,
            displayTime: slot.displayTime,
            rate: slot.rate,
            period: slot.period,
          })),
        },
      });

      setBookingReference(result.bookingReference);
      setTransactionId(result.transactionId);

      setCurrentStep('qr');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentProofUploaded = () => {
    setCurrentStep('pending');
  };

  const handleBackToHome = () => {
    setCurrentStep('calendar');
    setBookingForm({
      name: '',
      contact: '',
      email: '',
      date: undefined,
      timeSlots: [],
      agreedToTerms: false,
    });
    setSelectedDate(undefined);
    setBookingReference('');
    setTransactionId('');
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // convenient derived values for summary / confirmation
  const selectedTimesText = bookingForm.timeSlots
    .map(s => s.displayTime)
    .join(', ');
  const totalRate = bookingForm.timeSlots.reduce(
    (sum, s) => sum + Number(s.rate),
    0
  );

  return (
    <section
      id="booking"
      className="py-20 bg-gradient-to-br from-black via-purple-900 to-blue-900 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1613894811137-b5ee44ba3cb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxncmFmZml0aSUyMHdhbGwlMjB1cmJhbiUyMGFydHxlbnwxfHx8fDE3NTczODczODN8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-pink-500 via-orange-500 to-blue-400 mb-4 hover:scale-105 transition-transform duration-300"
            style={{
              filter:
                'drop-shadow(0 0 20px rgba(50, 205, 50, 0.6)) drop-shadow(0 0 30px rgba(255, 20, 147, 0.4))',
            }}
          >
            <div className="text-[48px]">Simple, Fast, and Secure</div>
          </h2>
          <p className="text-xl text-gray-300">
            Reserve your slot in 3 easy steps.
          </p>
        </div>

        {/* Step Indicators */}
        {/* ... unchanged step indicators ... */}

        {/* Booking Interface */}
        <div className="max-w-6xl mx-auto">
          {/* Only show booking steps when not in QR or Pending */}
          {currentStep !== 'qr' && currentStep !== 'pending' && (
            <>
              {currentStep === 'calendar' && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  {/* Calendar */}
                  <div className="lg:w-2/5">
                    <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 h-full">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-white flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-pink-400" />
                          Select a Date
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={(date: Date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          className="w-full rounded-md border border-purple-500/30 bg-black/30 text-white"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Time Slots */}
                  <div className="lg:flex-1">
                    <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 h-full">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Clock className="w-5 h-5 text-pink-400" />
                          Available Time Slots for {formatDate(selectedDate)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!selectedDate ? (
                          <div className="text-center py-12">
                            <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">
                              Please select a date first
                            </p>
                          </div>
                        ) : loadingSlots ? (
                          <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-400">
                              Loading available slots...
                            </p>
                          </div>
                        ) : slotsError ? (
                          <div className="text-center py-12">
                            <p className="text-red-400">
                              Failed to load slots. Please try again.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {timeSlots.map(slot => {
                              const isSelected = bookingForm.timeSlots.some(
                                s => s.time === slot.time
                              );
                              return (
                                <button
                                  key={slot.time}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  disabled={!slot.available}
                                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                                    slot.available
                                      ? isSelected
                                        ? 'border-pink-500 bg-pink-500/20 text-white'
                                        : 'border-gray-600 bg-gray-800/50 text-white hover:border-pink-400 hover:bg-pink-400/10'
                                      : 'border-gray-700 bg-gray-900/50 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-left">
                                      <div className="font-bold text-sm">
                                        {slot.displayTime}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        PHP {slot.rate}/hour
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          slot.period === 'evening'
                                            ? 'destructive'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {slot.period === 'evening'
                                          ? 'Premium'
                                          : 'Standard'}
                                      </Badge>
                                      {slot.available ? (
                                        <span className="text-green-400 text-xs">
                                          {isSelected
                                            ? 'Selected'
                                            : 'Available'}
                                        </span>
                                      ) : (
                                        <span className="text-red-400 text-xs">
                                          Booked
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {currentStep === 'form' && (
                <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-white text-center">
                      Enter Your Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-white">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={bookingForm.name}
                          onChange={e =>
                            setBookingForm(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="bg-gray-800/50 border-gray-600 text-white"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact" className="text-white">
                          Contact Number *
                        </Label>
                        <Input
                          id="contact"
                          value={bookingForm.contact}
                          onChange={e =>
                            setBookingForm(prev => ({
                              ...prev,
                              contact: e.target.value,
                            }))
                          }
                          className="bg-gray-800/50 border-gray-600 text-white"
                          placeholder="09XX XXX XXXX"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={bookingForm.email}
                        onChange={e =>
                          setBookingForm(prev => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="bg-gray-800/50 border-gray-600 text-white"
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30">
                      <h4 className="text-white font-bold mb-2">
                        Booking Summary
                      </h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{formatDate(bookingForm.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{selectedTimesText}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Rate:</span>
                          <span>PHP {totalRate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={bookingForm.agreedToTerms}
                        onCheckedChange={(checked: boolean) =>
                          setBookingForm(prev => ({
                            ...prev,
                            agreedToTerms: checked,
                          }))
                        }
                      />
                      <Label htmlFor="terms" className="text-white text-sm">
                        I agree to the Terms and Conditions of WallStreet
                        Sport.
                      </Label>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => setCurrentStep('calendar')}
                        variant="outline"
                        className="flex-1 bg-black border-gray-600 text-white hover:bg-gray-800"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleFormSubmit}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      >
                        Continue to Confirmation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'confirmation' && (
                <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-white text-center">
                      Confirm Your Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-purple-900/30 p-6 rounded-lg border border-purple-500/30">
                      <div className="grid gap-4">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Date:</span>
                          <span className="text-white font-bold">
                            {formatDate(bookingForm.date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Time:</span>
                          <span className="text-white font-bold">
                            {selectedTimesText}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Rate:</span>
                          <span className="text-white font-bold">
                            PHP {totalRate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Name:</span>
                          <span className="text-white font-bold">
                            {bookingForm.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Contact:</span>
                          <span className="text-white font-bold">
                            {bookingForm.contact}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Email:</span>
                          <span className="text-white font-bold">
                            {bookingForm.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => setCurrentStep('form')}
                        variant="outline"
                        className="flex-1 bg-black border-gray-600 text-white hover:bg-gray-800"
                        disabled={initiatePayment.isPending}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleConfirmBooking}
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                        disabled={initiatePayment.isPending}
                      >
                        {initiatePayment.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Confirm & Pay via GCash'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Continue Button for Calendar Step */}
              {currentStep === 'calendar' &&
                selectedDate &&
                bookingForm.timeSlots.length > 0 && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={() => setCurrentStep('form')}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-12 py-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 text-lg"
                    >
                      Continue to Booking Form
                    </Button>
                  </div>
                )}
            </>
          )}

          {/* Pending Confirmation Screen */}
          {currentStep === 'pending' && (
            <PendingConfirmation
              bookingReference={bookingReference}
              email={bookingForm.email}
              onBackToHome={handleBackToHome}
            />
          )}
        </div>

        {/* QR Code Payment Modal */}
        <QRCodePaymentModal
          isOpen={currentStep === 'qr'}
          onClose={() => setCurrentStep('confirmation')}
          onBack={() => setCurrentStep('confirmation')}
          amount={paymentAmount}
          transactionId={transactionId}
          onSuccess={handlePaymentProofUploaded}
        />
      </div>
    </section>
  );
}
