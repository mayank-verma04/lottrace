/**
 * Remove email verification columns from users table.
 * Pending registrations are now handled via Redis caching.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('verification_otp');
    table.dropColumn('verification_expires_at');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').notNullable().defaultTo(true);
    table.text('verification_otp').nullable();
    table.timestamp('verification_expires_at', { useTz: true }).nullable();
  });
};
