const { Resend } = require("resend");

const resend = new Resend('re_deUEPV4N_7T74W6derPPn1qd5MgTaeeEz');

async function sendEmail(to, subject, html) {
    try {
        const response = await resend.emails.send({
            from: "Hubbies <noreply@hardesk.fun>",
            to: to,
            subject: subject,
            html: html,
        });

        return { success: true, response };
    } catch (error) {
        console.error("Error enviando email con Resend:", error);
        return { success: false, error };
    }
}

module.exports = { sendEmail };
