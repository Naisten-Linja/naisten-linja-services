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
      db.addColumn.bind(db, 'letters', 'title_iv', { type: 'string' }),
      db.addColumn.bind(db, 'letters', 'content_iv', { type: 'string' }),
      db.addColumn.bind(db, 'replies', 'content_iv', { type: 'string' }),
    ],
    callback,
  );
};

exports.down = function (db) {
  // Deleting all 'iv' values for existing letters and replies would
  // make them impossible to decrypt. So this step should not be rolled back.
  return null;
};

exports._meta = {
  version: 1,
};
