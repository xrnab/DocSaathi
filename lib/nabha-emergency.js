// Static offline emergency contacts for Nabha, Punjab Block
export const NABHA_EMERGENCY_CONTACTS = [
  {
    name: "Ambulance Services",
    number: "108",
    description: "24/7 Free emergency medical transport and response",
    icon: "🚑"
  },
  {
    name: "ASHA Worker Helpline",
    number: "104",
    description: "Support for maternal health and village medical triaging",
    icon: "👩‍⚕️"
  },
  {
    name: "Lt Gen Shivdev Singh Civil Hospital (Nabha)",
    number: "01765-220023",
    description: "Primary public sub-divisional healthcare facility in Nabha block",
    icon: "🏥"
  },
  {
    name: "Patiala Rajindra Hospital",
    number: "0175-2213099",
    description: "Tertiary care referral medical college and hospital in Patiala district",
    icon: "🏢"
  }
];

/**
 * Returns emergency contacts and caches them in localStorage on client side for robust offline access
 */
export function getEmergencyContacts() {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("nabha_emergency_contacts");
      if (cached) {
        return JSON.parse(cached);
      }
      localStorage.setItem("nabha_emergency_contacts", JSON.stringify(NABHA_EMERGENCY_CONTACTS));
    } catch (e) {
      console.warn("localStorage not available, returning static list:", e);
    }
  }
  return NABHA_EMERGENCY_CONTACTS;
}
