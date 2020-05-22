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
      db.createTable.bind(db, 'letters', {
        id: { type: 'int', autoIncrement: true, primary: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'date', notNull: true },
        status: { type: 'string', notNull: true, defaultValue: 'pending' },

        // Set the uniqueness as a combination of both keys
        access_key: { type: 'string', unique: true, notNull: true },
        access_password: { type: 'string', notNull: true },
        access_password_salt: { type: 'string', notNull: true },

        title: { type: 'string' },
        content: { type: 'text' },
        assigned_responder_uuid: {
          type: 'string',
          foreignKey: {
            name: 'letters_users_uuid_fk',
            table: 'users',
            mapping: 'uuid',
            rules: {
              onDelete: 'SET NULL',
            },
          },
        },
      }),
      queries.autoGenerateUuid(db, 'letters'), // Generate uuid on create
      queries.autoGenerateCreated(db, 'letters'), // Generate created on create
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'letters')], callback);
};

exports._meta = {
  version: 1,
};
