/**
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('audit_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').references('id').inTable('organizations'); // null for platform actions
    table.uuid('actor_id').references('id').inTable('users'); // null for API key or system
    table.text('actor_type').notNullable().defaultTo('user'); // user | api_key | system | super_admin
    table.text('actor_label'); // email or API key label
    table.text('action').notNullable(); // e.g. 'lot.void', 'user.invite'
    table.text('entity_type'); // lot, event, user, etc.
    table.uuid('entity_id');
    table.jsonb('before_state');
    table.jsonb('after_state');
    table.jsonb('metadata');
    table.specificType('ip_address', 'inet');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // append-only: no updated_at

    table.index('organization_id', 'idx_audit_org');
    table.index('actor_id', 'idx_audit_actor');
  });

  // Indexes needing raw SQL for DESC ordering and composite
  await knex.raw(`
    CREATE INDEX idx_audit_org_created ON audit_log(organization_id, created_at DESC)
  `);
  await knex.raw(`
    CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id)
  `);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('audit_log');
};
