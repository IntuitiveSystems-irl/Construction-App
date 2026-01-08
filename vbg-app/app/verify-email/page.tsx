import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-center mt-20">Verifying your email...</p>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
