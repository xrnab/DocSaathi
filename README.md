# DocSaathi: The Ultimate Telemedicine & Healthcare Platform 🏥🚀

**DocSaathi** is a premium, full-stack healthcare platform designed to bridge the gap between patients and doctors through secure video consultations, intelligent symptom analysis, and seamless medical record management.

![DocSaathi Hero](public/hero-duo.png)

## 🌟 Key Features

### 👨‍⚕️ For Patients
- **Smart Symptom Checker**: AI-powered triage to help you understand your health concerns before booking.
- **Instant Video Consultations**: High-quality, secure telemedicine powered by **Vonage Video API**.
- **Specialist Discovery**: Find and book appointments with verified doctors across various specialties.
- **Emergency Locator**: Real-time GPS tracking for nearby hospitals, clinics, and pharmacies.
- **Health Records Hub**: Manage your medical history, vitals, and prescriptions in one secure place.
- **Credit System**: Easy-to-use consultation credit system for hassle-free payments.

### 🩺 For Doctors
- **Professional Dashboard**: Manage your schedule, upcoming appointments, and patient queue.
- **Digital Prescriptions**: Add consultation notes and medical advice directly to patient records.
- **Earnings Tracking**: Monitor your earned credits and manage payouts.
- **Patient History**: Access comprehensive patient records during consultations for better care.

### 🛡️ For Administrators
- **Verification Portal**: Review and verify doctor credentials to maintain platform quality.
- **User Management**: Oversee all platform activity, user roles, and security.
- **Financial Overview**: Track transactions, platform revenue, and payout requests.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Database**: [PostgreSQL (via Neon)](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Video API**: [Vonage Video API](https://www.vonage.com/communications-apis/video/)
- **Styling**: Tailwind CSS & Shadcn UI
- **Location Services**: [Geoapify](https://www.geoapify.com/) & [OpenStreetMap](https://www.openstreetmap.org/)
- **AI Triage**: [Groq AI](https://groq.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Neon PostgreSQL instance
- Clerk, Vonage, and Groq API keys

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/docsaathi.git
   cd docsaathi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   DATABASE_URL="your-neon-url"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-key"
   CLERK_SECRET_KEY="your-key"
   VONAGE_APPLICATION_ID="your-id"
   VONAGE_PRIVATE_KEY="your-key"
   GROQ_API_KEY="your-key"
   GEOAPIFY_API_KEY="your-key"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

- `/app`: Next.js App Router (Pages, Layouts, API routes)
- `/actions`: Server-side logic for Appointments, Records, and Admin workflows
- `/components`: Reusable UI components (Hero, Cards, Forms, Search)
- `/lib`: Configuration for Prisma, Clerk, and Utility functions
- `/prisma`: Database schema and migration settings
- `/public`: Static assets (images, icons)

---

## 📄 License

This project is built for the **DocSaathi Platform**. All rights reserved.

---

**Developed with ❤️ for a healthier future.**
