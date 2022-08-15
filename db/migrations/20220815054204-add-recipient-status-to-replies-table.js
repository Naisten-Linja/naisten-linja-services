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
      db.addColumn.bind(db, 'replies', 'recipient_status', {
        type: 'string',
        notNull: true,
        defaultValue: 'unread',
      }),
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
