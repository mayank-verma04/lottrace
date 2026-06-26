/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.text('first_name').notNullable();
    table.text('last_name').notNullable();
    table.text('email').notNullable();
    table.text('password_hash');
    table.text('role').notNullable();
    table.text('status').notNullable().defaultTo('invited');
    table.text('invite_token_hash');
    table.timestamp('invite_expires_at', { useTz: true });
    table.timestamp('last_login_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['email', 'organization_id'], { indexName: 'idx_users_email_org' });
    table.index(['organization_id', 'status'], 'idx_users_org_status');
    table.index('email', 'idx_users_email');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
