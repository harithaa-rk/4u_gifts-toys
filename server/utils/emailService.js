import nodemailer from "nodemailer";

/**
 * Send an authentic boutique-styled HTML wishlist invitation email.
 * If credentials are not configured in .env, logs the link safely to console.
 */
export const sendWishlistInvitationEmail = async ({
  recipientEmail,
  inviterName,
  wishlistName,
  role,
  message,
  invitationToken,
  expiresAt,
}) => {
  const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/wishlist/invitation/${invitationToken}`;
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You're invited to collaborate on a Wishlist</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF9FB; margin: 0; padding: 24px; color: #402044; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 2px solid #FF63B7; padding: 36px 30px; box-shadow: 0 10px 30px rgba(64,32,68,0.08); text-align: center; }
        .logo { font-size: 26px; font-weight: 900; color: #FF3F9D; letter-spacing: -0.5px; margin-bottom: 6px; }
        .sublogo { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #8057E8; font-weight: 800; margin-bottom: 24px; }
        .title { font-size: 22px; font-weight: 800; margin: 0 0 12px; color: #402044; }
        .desc { font-size: 15px; line-height: 1.6; color: #6b7280; margin: 0 0 20px; }
        .quote-box { background: #FFF0F6; border-left: 4px solid #FF3F9D; padding: 12px 18px; border-radius: 12px; font-style: italic; color: #402044; margin-bottom: 24px; text-align: left; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 50px; background: #FAF5FF; color: #8057E8; font-weight: 800; font-size: 12px; margin-bottom: 24px; border: 1px solid rgba(128,87,232,0.3); }
        .btn { display: inline-block; padding: 14px 34px; background: linear-gradient(135deg, #FF3F9D 0%, #8057E8 100%); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 50px; box-shadow: 0 6px 20px rgba(255,63,157,0.35); }
        .footer { font-size: 12px; color: #9ca3af; margin-top: 28px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🧸 4U Toys & Gifts</div>
        <div class="sublogo">Magical Collaborative Collections</div>
        
        <h1 class="title">${inviterName} invited you to collaborate!</h1>
        <p class="desc">
          You've been invited to view and curate the shared gift collection <strong>"${wishlistName}"</strong>.
        </p>

        <div class="badge">Your Assigned Role: ${role.toUpperCase()}</div>

        ${
          message
            ? `<div class="quote-box">"${message}"</div>`
            : ""
        }

        <div>
          <a href="${inviteUrl}" class="btn" target="_blank">Accept & Join Wishlist ✨</a>
        </div>

        <p class="footer">
          This single-use invitation is valid until <strong>${formattedExpiry}</strong>.<br>
          If you did not expect this invitation, you can safely ignore this email.<br>
          &copy; ${new Date().getFullYear()} 4U Toys & Gifts. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"4U Toys & Gifts" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `🎁 ${inviterName} invited you to collaborate on "${wishlistName}"`,
        html: emailHtml,
      });

      console.log(`[EMAIL] Wishlist invitation email sent to ${recipientEmail}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.warn(`[EMAIL] Failed to send email via SMTP (${err.message}). Falling back to in-app notification & console log.`);
      console.log(`[DEV INVITE LINK] -> ${inviteUrl}`);
      return { success: true, delivered: false, error: err.message, inviteUrl };
    }
  } else {
    console.log(`[EMAIL DEV MOCK] EMAIL_USER / EMAIL_PASS not set. Local invitation link for ${recipientEmail}: ${inviteUrl}`);
    return { success: true, delivered: false, mock: true, inviteUrl };
  }
};
