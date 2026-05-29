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
  const specialty = appointment.doctor?.specialty || "Specialist";
  const formattedTime = appointment.startTime ? new Date(appointment.startTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).replace(",", " at") : "Scheduled Time";

  const subject = isConfirmation 
    ? "DocSaathi: Your consultation is confirmed"
    : "DocSaathi: Your consultation is tomorrow";

  const introText = isConfirmation
    ? "Your online medical consultation has been successfully scheduled and confirmed."
    : "This is a friendly reminder that you have an upcoming online medical consultation tomorrow.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Namaste ${patientName},</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #333333;">
        ${introText}
      </p>
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #0369a1; margin: 0 0 10px 0;">Consultation Details</h3>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Specialty:</strong> ${specialty}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Time:</strong> ${formattedTime}</p>
      </div>
      <p style="font-size: 14px; color: #555555;">
        Please make sure to join the call <strong>5 minutes early</strong>. The secure video call link will be available directly in the DocSaathi app.
      </p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments" 
           style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
           View Appointments
        </a>
      </div>
      <p style="font-size: 12px; color: #666666; border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px;">
        Thank you for choosing DocSaathi.<br/>
        <strong>Team DocSaathi</strong>
      </p>
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
      console.log(`Appointment email sent to ${patientEmail} via Resend.`);
    } catch (err) {
      console.error("Failed to send appointment email via Resend:", err);
    }
  } else {
    console.log("=== MOCK EMAIL SENT ===");
    console.log(`To: ${patientEmail || 'No patient email provided'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, '').trim()}`);
    console.log("========================");
  }
}
