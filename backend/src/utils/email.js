const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('./logger');

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send password reset email
 * @param {string} email
 * @param {string} token
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] Password reset link for ${email}: ${resetLink}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'LotTrace Support <support@lottrace.com>',
      to: email,
      subject: 'Reset your LotTrace password',
      html: `
        <p>You requested a password reset for your LotTrace account.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    logger.error({ err: error, email }, 'Failed to send password reset email');
    // Continue even if email fails, so we don't leak information
  }
};

/**
 * Send organization invite email
 * @param {string} email
 * @param {string} token
 * @param {string} organizationName
 */
const sendInviteEmail = async (email, token, organizationName) => {
  const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] Invite link for ${email} to ${organizationName}: ${inviteLink}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'LotTrace <invites@lottrace.com>',
      to: email,
      subject: `You've been invited to join ${organizationName} on LotTrace`,
      html: `
        <p>You have been invited to join <strong>${organizationName}</strong> on LotTrace.</p>
        <p>Click the link below to set your password and access your account.</p>
        <p><a href="${inviteLink}">Accept Invitation</a></p>
        <p>This invite expires in 72 hours.</p>
      `,
    });
  } catch (error) {
    logger.error({ err: error, email }, 'Failed to send invite email');
    throw new Error('Failed to send invite email. Please try again.');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendInviteEmail,
  sendComplianceGapEmail: async (email, eventId, locationName, eventType, timestamp, gaps) => {
    const link = `${env.FRONTEND_URL}/events/${eventId}`;
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] Compliance gap email for ${email} on event ${eventId}`);
      return;
    }

    try {
      await resend.emails.send({
        from: 'LotTrace Alerts <alerts@lottrace.com>',
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
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to send compliance gap email');
    }
  },
  sendComplianceDigestEmail: async (email, organizationName, openGapsCount) => {
    const link = `${env.FRONTEND_URL}/compliance-gaps`;
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] Compliance digest email for ${email} with ${openGapsCount} gaps`);
      return;
    }

    try {
      await resend.emails.send({
        from: 'LotTrace Alerts <alerts@lottrace.com>',
        to: email,
        subject: `Weekly Compliance Digest: ${organizationName}`,
        html: `
          <p>Your weekly compliance digest for <strong>${organizationName}</strong> is ready.</p>
          <p>You currently have <strong>${openGapsCount}</strong> open compliance gaps requiring attention.</p>
          <p><a href="${link}">View Open Gaps in LotTrace</a></p>
        `,
      });
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to send compliance digest email');
    }
  }
};
