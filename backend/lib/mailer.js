// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP,
//   },
// });

// export async function sendEmail({ to, subject, text, html }) {
//   try {
//     const info = await transporter.sendMail({
//       from: `Eco Store <${process.env.GMAIL_USER}>`, 
//       to,
//       subject,
//       text,
//       html,
//     });
       
//     console.log("✅ Email sent:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("❌ Error sending email:", error.message);
//     throw error;
//   }
// }

import dotenv from "dotenv";
dotenv.config();

export async function sendEmail({ to, subject, text, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Eco Store",
        email: process.env.BREVO_SENDER_EMAIL, // Use your verified sender
      },
      to: [{ email: to }],
      subject: subject,
      textContent: text,
      htmlContent: html,
    }),
  });
 
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brevo API error: ${error.message}`);
  }

  const result = await response.json();
  console.log("✅ Email sent via Brevo to:", to);
  return result;
}