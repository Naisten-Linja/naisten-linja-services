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
      db.createTable.bind(db, 'users', {
        id: { type: 'int', primaryKey: true, autoIncrement: true },
        uuid: { type: 'string', notNull: true, unique: true },
        userName: { type: 'string', notNull: true },
        fullName: { type: 'string', notNull: true },
        email: { type: 'string', notNull: true },
        discourseUserId: { type: 'int', notNull: true, unique: true },
      }),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([
    db.dropTable.bind(db, 'users'),
  ], callback)
};

exports._meta = {
  version: 1,
};
