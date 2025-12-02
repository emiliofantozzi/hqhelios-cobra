/**
 * Pagina de inicio de sesion con Clerk.
 *
 * @module app/(auth)/sign-in
 */
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
