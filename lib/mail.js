import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends a verification status email to the doctor
 */
export async function sendDoctorVerificationEmail(doctorEmail, doctorName, status) {
  const isApproved = status === "VERIFIED";
  const subject = isApproved 
    ? "Congratulations! Your DocSaathi Profile is Verified" 
    : "Update on Your DocSaathi Doctor Verification Application";
    
  const html = isApproved 
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0284c7; margin-top: 0;">Namaste Dr. ${doctorName},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333333;">
          We are pleased to inform you that your application for verification on <strong>DocSaathi</strong> has been <strong>approved</strong> by our admin team!
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #333333;">
          Your profile is now verified, and you can start setting your availability slots to consult patients and earn credits.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/doctor" 
             style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
             Go to Doctor Dashboard
          </a>
        </div>
        <p style="font-size: 14px; color: #666666;">
          Thank you for joining our mission to provide quality healthcare in rural India.<br/>
          <strong>Team DocSaathi</strong>
        </p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Namaste Dr. ${doctorName},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333333;">
          Thank you for applying to join <strong>DocSaathi</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #333333;">
          Upon reviewing your uploaded credentials, our admin team was unable to verify your profile at this time.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #333333;">
          Please log into your dashboard, double-check your credentials/certificates, and submit them again for verification.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/doctor/verification" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
             Re-submit Verification
          </a>
        </div>
        <p style="font-size: 14px; color: #666666;">
          Best regards,<br/>
          <strong>Team DocSaathi</strong>
        </p>
      </div>
    `;

  if (resend) {
    try {
      await resend.emails.send({
        from: "DocSaathi <onboarding@resend.dev>",
        to: doctorEmail,
        subject: subject,
        html: html,
      });
      console.log(`Verification email sent to ${doctorEmail} via Resend.`);
    } catch (err) {
      console.error("Failed to send verification email via Resend:", err);
    }
  } else {
    console.log("=== MOCK EMAIL SENT ===");
    console.log(`To: ${doctorEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, '').trim()}`);
    console.log("========================");
  }
}

export async function sendAppointmentReminder(appointment, isConfirmation = false) {
  const patientEmail = appointment.patient?.email;
  const patientName = appointment.patient?.name || "Patient";
  const doctorName = appointment.doctor?.name || "Doctor";
  const specialty = appointment.doctor?.specialty || "General Practitioner";

  const dateObj = appointment.startTime ? new Date(appointment.startTime) : new Date();
  const formattedTime = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }) + " at " + dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }) + " IST";

  const subject = isConfirmation 
    ? `DocSaathi: Appointment Confirmed with Dr. ${doctorName}`
    : `DocSaathi: Your consultation is tomorrow — Dr. ${doctorName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <!-- DocSaathi header in green -->
      <div style="margin-bottom: 20px; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
        <span style="font-size: 24px; font-weight: 900; color: #16a34a; tracking-tight: -0.05em;">
          Doc<span style="color: #0ea5e9;">Saathi</span>
        </span>
      </div>

      <!-- Heading -->
      <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: bold;">
        ${isConfirmation ? "Your appointment is confirmed" : "Upcoming consultation reminder"}
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
        Namaste ${patientName}, ${isConfirmation ? "your consultation has been successfully booked." : "this is a friendly reminder for your scheduled session tomorrow."}
      </p>

      <!-- Clean Card Details -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 5px 0; font-size: 15px; color: #333333;"><strong>Doctor:</strong> Dr. ${doctorName}, ${specialty}</p>
        <p style="margin: 5px 0; font-size: 15px; color: #333333;"><strong>Time:</strong> ${formattedTime}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #555555; margin-bottom: 12px;">
        • Join 5 minutes early from the Appointments section in the app
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #555555; margin-bottom: 25px;">
        • If you have an Ayushman Bharat card, carry it to the appointment
      </p>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
           Go to Appointments
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 12px; color: #666666;">
        DocSaathi — Connecting Villages, Connecting Care
      </div>
    </div>
  `;

  if (resend && patientEmail) {
    try {
      await resend.emails.send({
        from: "DocSaathi <onboarding@resend.dev>",
        to: patientEmail,
        subject: subject,
        html: html,
      });
      console.log(`Appointment reminder email sent to ${patientEmail} via Resend.`);
    } catch (err) {
      console.error("Failed to send appointment reminder email via Resend:", err);
    }
  } else {
    console.log("=== MOCK EMAIL SENT ===");
    console.log(`To: ${patientEmail || 'No patient email provided'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, '').trim()}`);
    console.log("========================");
  }
}
