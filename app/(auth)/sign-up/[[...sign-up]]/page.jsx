import { ThemeAwareSignUp } from "@/components/clerk-elements";

export default function Page() {
  return (
    <ThemeAwareSignUp 
      path="/sign-up" 
      routing="path" 
      signInUrl="/sign-in"
      fallbackRedirectUrl="/"
    />
  );
}
