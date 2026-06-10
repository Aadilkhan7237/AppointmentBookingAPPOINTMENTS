import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);
const { BrevoClient, BrevoEnvironment } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    environment: BrevoEnvironment.Production,
});

// console.log("BREVO_API_KEY", process.env.BREVO_API_KEY);

export const sendMail = async ({
    email,
    subject,
    msg,
    text = "",
}) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY is missing");
        }

        const payload = {
            subject,
            htmlContent: msg,
            sender: {
                name: "MKHospital",
                email: "aadiluser2002@gmail.com",
            },
            to: [{ email }],
            ...(text && { textContent: text }),
        };

        const response = await brevo.transactionalEmails.sendTransacEmail(payload);

        console.log("Mail sent successfully:", response);

        return {
            success: true,
            messageId: response?.messageId,
        };
    } catch (error) {
        console.error("Mail Error:", error);

        return {
            success: false,
            error:
                error.response?.body?.message ||
                error.message,
        };
    }
};