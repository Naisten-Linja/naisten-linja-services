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
      db.addColumn.bind(db, 'letters', 'email', { type: 'string', notNull: false }),
      db.addColumn.bind(db, 'letters', 'email_iv', { type: 'string', notNull: false }),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series(
    [
      db.removeColumn.bind(db, 'letters', 'email'),
      db.removeColumn.bind(db, 'letters', 'email_iv')
    ],
    callback,
  );
};

exports._meta = {
  version: 1,
};
