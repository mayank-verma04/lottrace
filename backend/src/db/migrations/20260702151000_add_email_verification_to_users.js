/**
 * Add email verification columns to users table.
 * Existing users are backfilled as email_verified = true to avoid lockout.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.text('verification_otp').nullable();
    table.timestamp('verification_expires_at', { useTz: true }).nullable();
  });

  // Backfill: all existing users are considered verified
  await knex('users').update({ email_verified: true });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('verification_otp');
    table.dropColumn('verification_expires_at');
  });
};
