import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  amount: number;
  transactionId: string;
  onSuccess: () => void;
}

export function QRCodePaymentModal({
  isOpen,
  onClose,
  onBack,
  amount,
  transactionId,
  onSuccess,
}: QRCodePaymentModalProps) {
  const [step, setStep] = useState<'qr' | 'upload'>('qr');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 13) {
      setReferenceNumber(value);
    }
  };

  const handleUpload = async () => {
    if (!screenshot) {
      toast.error('Please upload a screenshot');
      return;
    }

    if (!referenceNumber.trim()) {
      toast.error('Please enter reference number');
      return;
    }

    if (referenceNumber.length !== 13) {
      toast.error('Reference number must be exactly 13 digits');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('transactionId', transactionId);
      formData.append('referenceNumber', referenceNumber.trim());

      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/payments/upload-proof`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('Payment proof submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setStep('qr');
    setReferenceNumber('');
    setScreenshot(null);
    setPreviewUrl('');
    onBack();
  };

  return (
<   Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent
        className="
          w-[95vw] sm:max-w-lg
          max-h-[90vh]
          p-0
          bg-black/95 backdrop-blur-md
          border-purple-500/30
          flex flex-col
          overflow-hidden
        "
      >
        {/* Header (non-scrolling) */}
        <DialogHeader className="px-4 sm:px-6 pt-4 pb-2 border-b border-purple-500/30 bg-black/95 shrink-0">
          <DialogTitle className="text-white text-center text-base sm:text-lg">
            {step === 'qr' ? 'Scan QR Code to Pay' : 'Upload Payment Proof'}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-4 custom-scrollbar">
          {step === 'qr' && (
            <div className="space-y-4">
              {/* Amount Display */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">Amount to Pay</p>
                <p className="text-2xl font-bold text-pink-400">PHP {amount}</p>
              </div>

              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-lg flex items-center justify-center">
                  <img
                    src="/gcash-qr.png"
                    alt="GCash QR Code"
                    className="object-contain"
                    style={{ width: 250, height: 250 }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-white text-sm">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-white text-xs mt-2 space-y-1 list-decimal list-inside">
                  <li>Open your GCash app</li>
                  <li>Tap &quot;Scan QR&quot;</li>
                  <li>Scan the QR code above</li>
                  <li>Enter PHP {amount} and confirm payment</li>
                  <li>Take a screenshot of the receipt</li>
                </ol>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              {/* Reference Number Input */}
              <div className="space-y-2">
                <Label htmlFor="reference" className="text-white">
                  GCash Reference Number * (13 digits)
                </Label>
                <Input
                  id="reference"
                  value={referenceNumber}
                  onChange={handleReferenceChange}
                  className="bg-gray-800/50 border-gray-600 text-white"
                  placeholder="Enter 13-digit reference number"
                  maxLength={13}
                  type="text"
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-400">
                  Found on your GCash receipt ({referenceNumber.length}/13 digits)
                </p>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label className="text-white">Upload Receipt Screenshot *</Label>

                {!previewUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-pink-400 bg-pink-400/10'
                        : 'border-gray-600 bg-gray-800/50 hover:border-pink-400'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-full max-h-[50vh] object-contain bg-gray-800 rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setScreenshot(null);
                        setPreviewUrl('');
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2">
                <p className="text-yellow-300 text-xs">
                  Make sure your screenshot clearly shows the reference number and amount paid.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer (non-scrolling buttons) */}
        <div className="border-t border-gray-700 px-4 sm:px-6 py-3 bg-black/95 shrink-0">
          {step === 'qr' ? (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 bg-black border-gray-600 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => setStep('upload')}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                I've Paid - Upload Proof
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setStep('qr')}
                variant="outline"
                className="flex-1 bg-black border-gray-600 text-white hover:bg-gray-800"
                disabled={uploading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!screenshot || referenceNumber.length !== 13 || uploading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Payment Proof'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
