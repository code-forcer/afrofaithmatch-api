const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const BRAND_COLOR = "#ff0036";
const SITE_NAME = "Afro Faith Match";
const SITE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Base email HTML template ──────────────────────────────────────
function baseTemplate(title, bodyHtml) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:${BRAND_COLOR};padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                    ✝ ${SITE_NAME}
                  </h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">
                    Faith-Based Christian Connections
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  ${bodyHtml}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#999;font-size:12px;margin:0;">
                    © ${new Date().getFullYear()} ${SITE_NAME} · 
                    <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Visit Site</a> · 
                    <a href="${SITE_URL}/privacy" style="color:${BRAND_COLOR};text-decoration:none;">Privacy</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── Welcome Email ─────────────────────────────────────────────────
async function sendWelcomeEmail(user) {
  const html = baseTemplate(
    `Welcome to ${SITE_NAME}!`,
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      Welcome, ${user.name}! 🎉
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      We're so glad you've joined <strong>${SITE_NAME}</strong> — the premier Christian dating community 
      connecting African believers across the globe through faith and love.
    </p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">
      Here's what you can do next:
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:${BRAND_COLOR};font-size:18px;margin-right:10px;">✓</span>
          <span style="color:#333;">Complete your <a href="${SITE_URL}/profile" style="color:${BRAND_COLOR};">profile</a> with your faith details</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:${BRAND_COLOR};font-size:18px;margin-right:10px;">✓</span>
          <span style="color:#333;">Browse Christian singles on our <a href="${SITE_URL}/browse" style="color:${BRAND_COLOR};">Browse page</a></span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:${BRAND_COLOR};font-size:18px;margin-right:10px;">✓</span>
          <span style="color:#333;">Send an interest to someone who catches your heart ❤️</span>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin:32px 0;">
      <a href="${SITE_URL}/browse" 
         style="background:${BRAND_COLOR};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Start Browsing Profiles →
      </a>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.6;">
      "He who finds a wife finds what is good and receives favor from the LORD." — Proverbs 18:22
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🙏 Welcome to ${SITE_NAME}, ${user.name}!`,
    html,
  });
}

// ─── Interest Received Email ───────────────────────────────────────
async function sendInterestEmail(recipient, sender) {
  const html = baseTemplate(
    "Someone is interested in you!",
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      You have a new interest! 💌
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${recipient.name}</strong>, great news! 
      <strong>${sender.name}</strong> has sent you an interest on ${SITE_NAME}.
    </p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">
      If you feel the same, accept their interest and start a conversation — 
      you never know where faith might lead! 🙏
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${SITE_URL}/interests" 
         style="background:${BRAND_COLOR};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        View Interest →
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      "Two are better than one, because they have a good return for their labor." — Ecclesiastes 4:9
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: recipient.email,
    subject: `💌 ${sender.name} is interested in you on ${SITE_NAME}!`,
    html,
  });
}

// ─── Interest Accepted Email ───────────────────────────────────────
async function sendInterestAcceptedEmail(recipient, acceptor) {
  const html = baseTemplate(
    "Your interest was accepted!",
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      It's a match! 🎊
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      Wonderful news, <strong>${recipient.name}</strong>! 
      <strong>${acceptor.name}</strong> has accepted your interest. 
      You can now start chatting!
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${SITE_URL}/chat" 
         style="background:${BRAND_COLOR};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Start Chatting →
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      "Love is patient, love is kind." — 1 Corinthians 13:4
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: recipient.email,
    subject: `🎊 ${acceptor.name} accepted your interest on ${SITE_NAME}!`,
    html,
  });
}

// ─── Contact Form Confirmation ─────────────────────────────────────
async function sendContactConfirmation(contact) {
  const html = baseTemplate(
    "We received your message",
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      Thank you, ${contact.name}! ✉️
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      We have received your message and will get back to you within 24–48 hours.
    </p>
    <div style="background:#f9f9f9;border-left:4px solid ${BRAND_COLOR};padding:16px 20px;border-radius:4px;margin:0 0 24px;">
      <p style="margin:0;color:#333;font-size:14px;"><strong>Subject:</strong> ${contact.subject}</p>
      <p style="margin:8px 0 0;color:#555;font-size:14px;">${contact.message.substring(0, 200)}${contact.message.length > 200 ? "..." : ""}</p>
    </div>
    <p style="color:#888;font-size:13px;">
      God bless you — the ${SITE_NAME} Team
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: contact.email,
    subject: `We received your message — ${SITE_NAME}`,
    html,
  });
}

// ─── Admin New Contact Alert ───────────────────────────────────────
async function sendAdminContactAlert(contact) {
  await transporter.sendMail({
    from: `"${SITE_NAME} System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `[New Contact] ${contact.subject} — from ${contact.name}`,
    text: `Name: ${contact.name}\nEmail: ${contact.email}\nSubject: ${contact.subject}\n\n${contact.message}`,
  });
}

// ─── Password Reset Email ──────────────────────────────────────────
async function sendPasswordResetEmail(user, resetToken) {
  const resetURL = `${SITE_URL}/reset-password?token=${resetToken}`;
  const html = baseTemplate(
    "Reset Your Password",
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      Password Reset Request 🔐
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${user.name}</strong>, we received a request to reset your password.
      Click the button below (valid for 10 minutes):
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetURL}" 
         style="background:${BRAND_COLOR};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Reset Password →
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      If you didn't request this, please ignore this email. Your password remains unchanged.
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Password Reset — ${SITE_NAME}`,
    html,
  });
}

// ─── Newsletter Welcome ────────────────────────────────────────────
async function sendNewsletterWelcome(subscriber) {
  const unsubURL = `${SITE_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const html = baseTemplate(
    "You're subscribed!",
    `
    <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
      You're on the list! 📬
    </h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      Thank you for subscribing to the <strong>${SITE_NAME}</strong> newsletter! 
      You'll receive inspiring faith content, dating tips, and community updates straight to your inbox.
    </p>
    <p style="color:#888;font-size:12px;margin:24px 0 0;">
      <a href="${unsubURL}" style="color:#999;">Unsubscribe</a>
    </p>
    `
  );

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
    to: subscriber.email,
    subject: `You're subscribed to ${SITE_NAME}! 📬`,
    html,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendInterestEmail,
  sendInterestAcceptedEmail,
  sendContactConfirmation,
  sendAdminContactAlert,
  sendPasswordResetEmail,
  sendNewsletterWelcome,
};
