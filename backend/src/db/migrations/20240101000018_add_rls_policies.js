const TENANT_TABLES = [
  'users',
  'locations',
  'products',
  'lots',
  'events',
  'attachments',
  'audit_log',
];

// event_lot_links has no organization_id column — RLS not applicable directly
// (access controlled through events table which has RLS)

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  for (const table of TENANT_TABLES) {
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    await knex.raw(`
      CREATE POLICY tenant_isolation_${table} ON ${table}
      USING (organization_id = current_setting('app.current_org_id', true)::uuid);
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  for (const table of TENANT_TABLES.reverse()) {
    await knex.raw(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
  }
};
