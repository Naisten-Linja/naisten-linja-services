'use strict';
const async = require('async');
const queries = require('../queries');

var dbm;
var type;
var seed;

/**
 * we receive the dbmigrate dependency from dbmigrate initially.
 * this enables us to not have to rely on node_path.
 */
exports.setup = function (options, seedlink) {
  dbm = options.dbmigrate;
  type = dbm.datatype;
  seed = seedlink;
};

exports.up = function (db, callback) {
  async.series(
    [
      // First, changing any empty object exceptions into an empyt array
      db.runSql.bind(
        db,
        `
        UPDATE booking_types
        SET exceptions='[]' WHERE
        exceptions::text = '{}'::text;
        `,
      ),
      // Alter exceptions columnt type with a custom casting expression
      db.runSql.bind(
        db,
        `
        ALTER TABLE booking_types
        ALTER COLUMN exceptions DROP DEFAULT,
        ALTER COLUMN exceptions TYPE text[] USING translate(exceptions::text, '[]','{}')::text[];
        `,
      ),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  return null;
};

exports._meta = {
  version: 1,
};
