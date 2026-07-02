const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('./logger');

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send email via Resend — single transport for all environments.
 * When DEV_EMAIL_OVERRIDE is set, all emails redirect to that address
 * with the original recipient shown in the subject line.
 * @param {{ from?: string, to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ from, to, subject, html }) => {
  try {
    const actualTo = env.DEV_EMAIL_OVERRIDE || to;
    const actualSubject = env.DEV_EMAIL_OVERRIDE
      ? `[→ ${to}] ${subject}`
      : subject;

    const result = await resend.emails.send({
      from: from || env.EMAIL_FROM,
      to: actualTo,
      subject: actualSubject,
      html,
    });
    logger.info({ to: actualTo, originalTo: to, subject, id: result?.data?.id }, 'Email sent via Resend');
    return result;
  } catch (error) {
    logger.error({ err: error, to, subject }, 'Failed to send email via Resend');
    throw error;
  }
};

/**
 * Send email verification OTP
 * @param {string} email
 * @param {string} otp
 * @param {string} firstName
 */
const sendVerificationEmail = async (email, otp, firstName) => {
  await sendEmail({
    to: email,
    subject: `${otp} — Verify your LotTrace account`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">LotTrace</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi ${firstName},</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">Enter the code below to verify your email and activate your LotTrace account. This code expires in 15 minutes.</p>
          <!-- OTP Box -->
          <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:24px;text-align:center;margin:0 0 28px;">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#1e3a5f;">${otp}</span>
          </div>
          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">If you didn't create a LotTrace account, you can safely ignore this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #f0f0f3;">
          <p style="margin:0;color:#b0b0b8;font-size:12px;">&copy; ${new Date().getFullYear()} LotTrace &middot; FDA FSMA 204 Compliance Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

/**
 * Send welcome email after first successful verification
 * @param {string} email
 * @param {string} firstName
 * @param {string} organizationName
 */
const sendWelcomeEmail = async (email, firstName, organizationName) => {
  const dashboardLink = `${env.FRONTEND_URL}/dashboard`;

  await sendEmail({
    to: email,
    subject: `Welcome to LotTrace, ${firstName}! 🎉`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);overflow:hidden;">
        <!-- Hero Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 50%,#3b82f6 100%);padding:48px 40px;text-align:center;">
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Welcome to LotTrace</h1>
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;">Supply chain traceability, simplified.</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">Your account for <strong style="color:#1e3a5f;">${organizationName}</strong> is now active. You're on your way to full FDA FSMA 204 compliance &mdash; let's get started.</p>

          <!-- Feature Cards -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr>
              <td style="padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #3b82f6;margin-bottom:8px;">
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:600;">📍 Set Up Locations</p>
                <p style="margin:0;color:#6b7280;font-size:13px;">Add your facilities, warehouses, and partner sites.</p>
              </td>
            </tr>
            <tr><td style="height:8px;"></td></tr>
            <tr>
              <td style="padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #10b981;">
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:600;">📦 Create Your First Lot</p>
                <p style="margin:0;color:#6b7280;font-size:13px;">Record lot codes and start tracking product movement.</p>
              </td>
            </tr>
            <tr><td style="height:8px;"></td></tr>
            <tr>
              <td style="padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #f59e0b;">
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:600;">🔍 Run a Trace</p>
                <p style="margin:0;color:#6b7280;font-size:13px;">Trace any lot forward or backward in seconds &mdash; not days.</p>
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">Go to Dashboard &rarr;</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px 28px;border-top:1px solid #f0f0f3;">
          <p style="margin:0 0 4px;color:#9ca3af;font-size:13px;">Questions? Just reply to this email &mdash; we're here to help.</p>
          <p style="margin:0;color:#b0b0b8;font-size:12px;">&copy; ${new Date().getFullYear()} LotTrace &middot; FDA FSMA 204 Compliance Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

/**
 * Send password reset email
 * @param {string} email
 * @param {string} token
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: 'Reset your LotTrace password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">LotTrace</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">Password Reset Request</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">You requested a password reset for your LotTrace account. Click the button below to set a new password. This link expires in 1 hour.</p>
          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td align="center">
              <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">Reset Password &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #f0f0f3;">
          <p style="margin:0;color:#b0b0b8;font-size:12px;">&copy; ${new Date().getFullYear()} LotTrace &middot; FDA FSMA 204 Compliance Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

/**
 * Send organization invite email
 * @param {string} email
 * @param {string} token
 * @param {string} organizationName
 */
const sendInviteEmail = async (email, token, organizationName) => {
  const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${organizationName} on LotTrace`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);overflow:hidden;">
        <!-- Hero Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 50%,#3b82f6 100%);padding:48px 40px;text-align:center;">
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">You're Invited!</h1>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">Join <strong>${organizationName}</strong> on LotTrace</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">You've been invited to join <strong style="color:#1e3a5f;">${organizationName}</strong> on LotTrace — the FDA FSMA 204 supply chain traceability platform.</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">Click the button below to set your password and activate your account. This invitation expires in 72 hours.</p>
          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td align="center">
              <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">Accept Invitation &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">If you weren't expecting this invitation, you can safely ignore this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px 28px;border-top:1px solid #f0f0f3;">
          <p style="margin:0;color:#b0b0b8;font-size:12px;">&copy; ${new Date().getFullYear()} LotTrace &middot; FDA FSMA 204 Compliance Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
  sendComplianceGapEmail: async (email, eventId, locationName, eventType, timestamp, gaps) => {
    const link = `${env.FRONTEND_URL}/events/${eventId}`;

    await sendEmail({
      to: email,
      subject: `Compliance Gap Detected: ${eventType} at ${locationName}`,
      html: `
        <p>A new event was recorded with missing Key Data Elements.</p>
        <ul>
          <li><strong>Event ID:</strong> ${eventId}</li>
          <li><strong>Type:</strong> ${eventType}</li>
          <li><strong>Location:</strong> ${locationName}</li>
          <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
          <li><strong>Gaps:</strong> ${gaps.map(g => g.field).join(', ')}</li>
        </ul>
        <p><a href="${link}">View Event in LotTrace</a></p>
      `,
    });
  },
  sendComplianceDigestEmail: async (email, organizationName, openGapsCount) => {
    const link = `${env.FRONTEND_URL}/compliance-gaps`;

    await sendEmail({
      to: email,
      subject: `Weekly Compliance Digest: ${organizationName}`,
      html: `
        <p>Your weekly compliance digest for <strong>${organizationName}</strong> is ready.</p>
        <p>You currently have <strong>${openGapsCount}</strong> open compliance gaps requiring attention.</p>
        <p><a href="${link}">View Open Gaps in LotTrace</a></p>
      `,
    });
  }
};
