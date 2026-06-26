/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);

  await knex.schema.raw(`
    CREATE POLICY tenant_isolation_users ON users
    USING (organization_id = current_setting('app.current_org_id', true)::uuid);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.raw(`DROP POLICY IF EXISTS tenant_isolation_users ON users;`);
  await knex.schema.raw(`ALTER TABLE users DISABLE ROW LEVEL SECURITY;`);
};
