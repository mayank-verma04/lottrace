/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE'); // null = org-wide
    table.text('type').notNullable(); // compliance_gap | import_complete | export_ready | recall_simulation
    table.text('title').notNullable();
    table.text('message').notNullable();
    table.text('link'); // deep link to relevant entity
    table.text('entity_type');
    table.uuid('entity_id');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'is_read', 'created_at'], 'idx_notifications_user');
    table.index(['organization_id', 'created_at'], 'idx_notifications_org');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notifications');
};
