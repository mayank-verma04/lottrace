import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const OTP_LENGTH = 6;

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const email = location.state?.email;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef([]);

  // Redirect to register if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email]);

  const handleChange = (index, value) => {
    // Only allow single digit
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (value && index === OTP_LENGTH - 1 && newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // Focus last filled input or auto-submit
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      const response = await api.post('/auth/verify-email', { email, otp: code });
      const { user, accessToken } = response.data.data;
      setVerified(true);

      // Brief success state before redirect
      setTimeout(() => {
        setAuth(user, accessToken);
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      const message = error.response?.data?.message || 'Verification failed';

      if (errorCode === 'VERIFICATION_EXPIRED') {
        toast.error('Code expired. Please request a new one.');
      } else {
        toast.error(message);
      }

      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);

    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('New verification code sent to your email');
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'RATE_LIMITED') {
        toast.error('Please wait before requesting another code.');
        setResendCooldown(30);
      } else {
        toast.error(error.response?.data?.message || 'Failed to resend code');
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  if (verified) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
            <p className="text-gray-500 text-sm">Redirecting to your dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* OTP Input Grid */}
          <div className="flex justify-center gap-2.5">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                className="h-14 w-12 text-center text-xl font-semibold tracking-wide rounded-lg border-2 focus:border-brand-500 focus:ring-brand-500 transition-colors"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => handleVerify(otp.join(''))}
            disabled={otp.some(d => d === '') || isVerifying}
            className="w-full"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          {/* Resend */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">Didn't receive the code?</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-brand-600 hover:text-brand-700"
            >
              {isResending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Button>
          </div>

          {/* Back to login */}
          <div className="text-center text-sm text-gray-500 pt-2 border-t">
            Already verified?{' '}
            <Link to="/login" className="text-brand-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
