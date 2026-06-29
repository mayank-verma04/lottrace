/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('imports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.text('filename').notNullable();
    table.text('storage_key').notNullable();
    table.text('cte_type').notNullable(); // creation | receiving | transformation | shipping
    table.text('status').notNullable().defaultTo('pending'); // pending | processing | complete | failed
    table.integer('total_rows');
    table.integer('valid_rows');
    table.integer('error_rows');
    table.text('error_report_key'); // S3 key for error report CSV
    table.text('job_id'); // BullMQ job ID
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('organization_id', 'idx_imports_org');
    table.index(['organization_id', 'status'], 'idx_imports_org_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('imports');
};
