/**
 * Pagina de registro con Clerk.
 *
 * @module app/(auth)/sign-up
 */
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
