/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('organizations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.text('slug').notNullable().unique();
    table.text('industry_vertical').notNullable().defaultTo('food');
    table.text('plan_tier').notNullable().defaultTo('starter');
    table.text('status').notNullable().defaultTo('active');
    table.text('timezone_default').notNullable().defaultTo('UTC');
    table.text('uom_default').notNullable().defaultTo('kg');
    table.jsonb('custom_settings').notNullable().defaultTo('{}');
    table.text('stripe_customer_id');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('status', 'idx_organizations_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('organizations');
};
