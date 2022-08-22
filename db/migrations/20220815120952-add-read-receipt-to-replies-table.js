'use strict';
const async = require('async');

var dbm;
var type;
var seed;

exports.up = function (db, callback) {
  async.series(
    [
      db.addColumn.bind(db, 'replies', 'read_receipt', {
        type: 'string',
        notNull: true,
        defaultValue: 'unread',
      }),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.removeColumn.bind(db, 'replies', 'read_receipt')], callback);
};

exports._meta = {
  version: 1,
};
