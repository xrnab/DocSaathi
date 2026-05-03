import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
  Pill,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-sky-400" />,
    title: "Create Your Profile",
    description:
      "Sign up and complete your profile to get personalized healthcare recommendations and services.",
    href: "/profile",
  },
  {
    icon: <Calendar className="h-6 w-6 text-sky-400" />,
    title: "Book Appointments",
    description:
      "Browse doctor profiles, check availability, and book appointments that fit your schedule.",
    href: "/doctors",
  },
  {
    icon: <Video className="h-6 w-6 text-sky-400" />,
    title: "Video Consultation",
    description:
      "Connect with doctors through secure, high-quality video consultations from the comfort of your home.",
    href: "/appointments",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-sky-400" />,
    title: "Consultation Credits",
    description:
      "Purchase credit packages that fit your healthcare needs with our simple subscription model.",
    href: "/pricing",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-sky-400" />,
    title: "Verified Doctors",
    description:
      "All healthcare providers are carefully vetted and verified to ensure quality care.",
    href: "/doctors",
  },
  {
    icon: <FileText className="h-6 w-6 text-sky-400" />,
    title: "Medical Documentation",
    description:
      "Access and manage your appointment history, doctor's notes, and medical recommendations.",
    href: "/records",
  },
  {
    icon: <Pill className="h-6 w-6 text-sky-400" />,
    title: "Pharmacy Locator",
    description:
      "Find and locate verified pharmacies near your current location to get your medications quickly.",
    href: "/medicines",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
    initials: "SP",
    name: "Sarah P.",
    role: "Patient",
    quote:
      "The video consultation feature saved me so much time. I was able to get medical advice without taking time off work or traveling to a clinic.",
  },
  {
    initials: "DR",
    name: "Dr. Robert M.",
    role: "Cardiologist",
    quote:
      "This platform has revolutionized my practice. I can now reach more patients and provide timely care without the constraints of a physical office.",
  },
  {
    initials: "JT",
    name: "James T.",
    role: "Patient",
    quote:
      "The credit system is so convenient. I purchased a package for my family, and we've been able to consult with specialists whenever needed.",
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-sky-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-sky-400'>never expire</strong> - use them whenever you need",
  "Monthly subscriptions give you <strong class='text-sky-400'>fresh credits every month</strong>",
  "Cancel or change your subscription <strong class='text-sky-400'>anytime</strong> without penalties",
];
