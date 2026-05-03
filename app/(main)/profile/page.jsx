import { ThemeAwareUserProfile } from "@/components/clerk-elements";
import { PageHeader } from "@/components/page-header";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageHeader
        icon={<User />}
        title="My Profile"
        backLink="/"
        backLabel="Back to Home"
      />
      
      <div className="flex justify-center mt-8">
        <ThemeAwareUserProfile 
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full max-w-4xl mx-auto",
              cardBox: "shadow-none",
            }
          }}
        />
      </div>
    </div>
  );
}
