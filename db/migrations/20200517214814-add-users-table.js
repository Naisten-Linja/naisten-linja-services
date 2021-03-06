'use strict';
const async = require('async');
const queries = require('../queries');

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  async.series(
    [
      db.createTable.bind(db, 'users', {
        id: { type: 'int', primaryKey: true, autoIncrement: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'timestamp', notNull: true },
        // All roles: unassigned, staff, volunteer
        role: { type: 'string', notNull: true, defaultValue: 'unassigned' },
        is_active: { type: 'boolean', notNull: true, defaultValue: false },

        // Information coming from Discourse
        discourse_user_id: { type: 'int', notNull: true, unique: true },
        full_name: { type: 'string' },
        email: { type: 'string', notNull: true },
      }),
      queries.autoGenerateCreated(db, 'users'), // Generate uuid on create
      queries.autoGenerateUuid(db, 'users'), // Generate created on create
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'users')], callback);
};

exports._meta = {
  version: 1,
};
