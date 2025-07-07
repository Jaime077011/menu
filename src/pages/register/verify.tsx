import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface VerificationPageProps {
  email?: string;
  token?: string;
}

const VerifyEmailPage: React.FC<VerificationPageProps> = () => {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const { token, email: queryEmail } = router.query;
    
    if (queryEmail) {
      setEmail(queryEmail as string);
    }

    if (token) {
      // Verify the token
      verifyEmail(token as string);
    } else if (!token && queryEmail) {
      // Just showing verification instructions
      setVerificationStatus('invalid');
      setMessage('Please check your email for the verification link.');
    }
  }, [router.query]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/register/verify-email?token=${token}`);
      const result = await response.json();

      if (result.success) {
        setVerificationStatus('success');
        setMessage('Your email has been verified successfully! You can now proceed to payment.');
        
        // Redirect to checkout after 3 seconds
        setTimeout(() => {
          if (result.registrationId) {
            router.push(`/checkout/${result.registrationId}`);
          }
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(result.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      console.error('Verification error:', error);
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    try {
      const response = await fetch('/api/register/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(result.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error('Resend error:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Email Verification - Restaurant Registration</title>
        <meta name="description" content="Verify your email address to complete restaurant registration" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
              {verificationStatus === 'loading' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              )}
              {verificationStatus === 'success' && (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {verificationStatus === 'error' && (
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {verificationStatus === 'invalid' && (
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {verificationStatus === 'loading' && 'Verifying Email...'}
              {verificationStatus === 'success' && 'Email Verified!'}
              {verificationStatus === 'error' && 'Verification Failed'}
              {verificationStatus === 'invalid' && 'Check Your Email'}
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>

          {verificationStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Redirecting to payment page in a few seconds...
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && email && (
            <div className="space-y-4">
              <button
                onClick={resendVerification}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {verificationStatus === 'invalid' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Verification Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      We've sent a verification email to <strong>{email}</strong>. 
                      Please click the link in the email to verify your account.
                    </p>
                  </div>
                  {email && (
                    <div className="mt-4">
                      <button
                        onClick={resendVerification}
                        className="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-md transition-colors"
                      >
                        Resend verification email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push('/register')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage; 