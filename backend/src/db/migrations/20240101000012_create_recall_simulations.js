/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('recall_simulations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.text('name').notNullable();
    table.uuid('triggering_lot_id').notNullable().references('id').inTable('lots');
    table.jsonb('params').notNullable().defaultTo('{}');
    table.jsonb('result_summary');
    table.text('result_storage_key'); // full result in S3 (can be large)
    table.text('status').notNullable().defaultTo('pending'); // pending | running | complete | failed
    table.uuid('run_by').notNullable().references('id').inTable('users');
    table.timestamp('run_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true });

    table.index('organization_id', 'idx_simulations_org');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('recall_simulations');
};
