'use strict';
const async = require('async');

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

// The "status_timestamp" will capture the time when the reply's status is changed 
// while the "updated" will capture the time when the reply's record is updated.
exports.up = function (db, callback) {
  async.series(
    [
      db.addColumn.bind(db, 'replies', 'status_timestamp', { type: 'timestamp', notNull: false }),
      db.runSql.bind(
        db,
        `
        --The default value of status_timestamp is the updated value
        UPDATE replies SET status_timestamp=updated;
      `,
      ),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.removeColumn.bind(db, 'replies', 'status_timestamp')], callback);
};

exports._meta = {
  version: 1,
};
