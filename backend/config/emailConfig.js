const { Resend } = require("resend");

const resend = new Resend('re_dcw9788o_NSYZ2LMMgxicPDBykHPLmrGr');

async function sendEmail(to, subject, html) {
    try {
        const response = await resend.emails.send({
            from: "Hobbies <onboarding@resend.dev>",
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
