/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token_hash').notNullable().unique();
    table.uuid('session_family').notNullable();
    table.text('device_hint');
    table.specificType('ip_address', 'inet');
    table.boolean('is_used').notNullable().defaultTo(false);
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_refresh_tokens_user');
    table.index('session_family', 'idx_refresh_tokens_family');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('refresh_tokens');
};
