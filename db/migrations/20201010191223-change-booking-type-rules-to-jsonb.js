'use strict';
const async = require('async');

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
      db.changeColumn.bind(
        db,
        'booking_types',
        'rules',
        { type: 'jsonb', notNull: true },
        callback,
      ),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series(
    [
      db.changeColumn.bind(
        db,
        'booking_types',
        'rules',
        { type: 'string', notNull: true },
        callback,
      ),
    ],
    callback,
  );
};

exports._meta = {
  version: 1,
};
