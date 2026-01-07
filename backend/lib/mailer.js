import dotenv from "dotenv";
dotenv.config();
import storeSettings from "../models/storeSettings.model.js";

export async function sendEmail({ to, subject, text, html }) {
  const settings = await storeSettings.findOne();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },

    body: JSON.stringify({
      sender: {
        name: `${
    settings?.storeName
  }`,
        email: process.env.BREVO_SENDER_EMAIL,
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
  console.log(" Email sent via Brevo to:", to);
  return result;
}