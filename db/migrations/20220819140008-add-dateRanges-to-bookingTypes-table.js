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
      //db.addColumn.bind(db, 'booking_types', 'date_ranges', { type: 'jsonb[]', notNull: true, defaultValue:  }),
      db.runSql.bind(
        db,
        `
        ALTER TABLE booking_types
        ADD COLUMN
          date_ranges JSONB[] NOT NULL DEFAULT ARRAY[ ('{"start":null,"end":null}')::JSONB ];
      `,
      ),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.removeColumn.bind(db, 'booking_types', 'date_ranges')], callback);
};

exports._meta = {
  version: 1,
};
