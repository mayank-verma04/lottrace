const uuid = require('uuid');
const argon2 = require('argon2');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  await knex('organizations').del();

  const orgId = uuid.v4();
  const userId = uuid.v4();
  
  const passwordHash = await argon2.hash('admin123', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });

  await knex('organizations').insert([
    {
      id: orgId,
      name: 'LotTrace System',
      slug: 'lottrace-system',
      industry_vertical: 'software',
      plan_tier: 'enterprise',
      status: 'active'
    }
  ]);

  await knex('users').insert([
    {
      id: userId,
      organization_id: orgId,
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@lottrace.com',
      password_hash: passwordHash,
      role: 'super_admin',
      status: 'active'
    }
  ]);
};
