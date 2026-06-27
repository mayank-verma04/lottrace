/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.text('password_reset_token_hash');
    table.timestamp('password_reset_expires_at', { useTz: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('password_reset_token_hash');
    table.dropColumn('password_reset_expires_at');
  });
};
