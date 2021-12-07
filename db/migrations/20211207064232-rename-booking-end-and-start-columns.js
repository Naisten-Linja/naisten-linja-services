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
      db.renameColumn.bind(db, 'bookings', 'start', 'start_time'),
      db.renameColumn.bind(db, 'bookings', 'end', 'end_time'),
    ],
    callback,
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
