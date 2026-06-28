// This hook is kept for backward compatibility but Google Login is now handled
// via the official @react-oauth/google <GoogleLogin /> component in Login.tsx and Signup.tsx
export function useGoogleAuth(_onToken: (idToken: string) => Promise<void>) {
  return {};
}
