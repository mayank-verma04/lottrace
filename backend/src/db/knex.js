const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';

/**
 * Knex singleton instance.
 * Import this wherever you need DB access:
 *   const db = require('../../db/knex');
 */
const db = knex(knexConfig[environment]);

module.exports = db;
