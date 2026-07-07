import { auth } from '@/auth';

/**
 * Returns the current authenticated user session from NextAuth.
 * Used by API route handlers to verify authentication.
 * Replaces the old custom JWT cookie approach.
 */
export async function getCurrentUser(): Promise<{ userId: string; email: string } | null> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }
  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
