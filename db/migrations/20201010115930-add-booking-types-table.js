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
      db.createTable.bind(db, 'booking_types', {
        id: { type: 'int', autoIncrement: true, primary: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'timestamp', notNull: true },

        name: { type: 'string' },
        // Rules that set which dates are bookable and possible exceptions
        rules: { type: 'string', notNull: true },
      }),
      queries.autoGenerateUuid(db, 'booking_types'), // Generate uuid on create
      queries.autoGenerateCreated(db, 'booking_types'), // Generate created on create
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'booking_types')], callback);
};

exports._meta = {
  version: 1,
};
