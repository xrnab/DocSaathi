import { ThemeAwareSignIn } from "@/components/clerk-elements";

export default function Page() {
  return (
    <ThemeAwareSignIn 
      path="/sign-in" 
      routing="path" 
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/"
    />
  );
}
