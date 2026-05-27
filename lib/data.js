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
    initials: "JS",
    name: "Jagdeep Singh",
    role: "Wheat Farmer, Nabha Block",
    quote:
      "DocSaathi's offline directories and voice checkers saved me! I got instant crop stubble eye-burn advice right in the fields without needing to travel all the way to Nabha Civil Hospital.",
  },
  {
    initials: "KK",
    name: "Karamjit Kaur",
    role: "ASHA Health Worker, Sauja Village",
    quote:
      "Having the WhatsApp prescription sharing and 108 ambulance link on our phones makes a huge difference. I can easily guide village families to generic medicines that fit their low budget.",
  },
  {
    initials: "MK",
    name: "Manpreet Kaur",
    role: "Primary School Teacher, Bhadson",
    quote:
      "During stubble burning season when the air gets heavy, the seasonal health report gives us warning checklists. It keeps my classroom parents informed and safe from respiratory issues.",
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-sky-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-sky-400'>never expire</strong> - use them whenever you need",
  "Monthly subscriptions give you <strong class='text-sky-400'>fresh credits every month</strong>",
  "Cancel or change your subscription <strong class='text-sky-400'>anytime</strong> without penalties",
];

// JSON data for seasonal diseases (Nabha district monthly update)
export const seasonalDiseases = [
  {
    id: "dengue",
    title: "Dengue Fever",
    riskLevel: "High Risk",
    symptoms: ["High fever", "Severe headache", "Pain behind eyes", "Joint & muscle pain"],
    prevention: "Use mosquito nets/repellent, remove standing water around houses.",
    statusColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  },
  {
    id: "flu",
    title: "Seasonal Influenza (Flu)",
    riskLevel: "Moderate Risk",
    symptoms: ["Cough & sore throat", "Body aches & chills", "Runny nose", "Fatigue"],
    prevention: "Get seasonal flu shot, avoid close contact with sick persons, practice hand hygiene.",
    statusColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  },
  {
    id: "heat_exhaustion",
    title: "Heat Exhaustion",
    riskLevel: "High Risk (Farm Labor)",
    symptoms: ["Heavy sweating", "Rapid pulse", "Muscle cramps", "Nausea & headache"],
    prevention: "Drink plenty of water/electrolytes, wear light clothing, avoid peak sun hours.",
    statusColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  }
];
