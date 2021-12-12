'use strict';
const async = require('async');
const queries = require('../queries');

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
      db.createTable.bind(db, 'pages', {
        id: { type: 'int', autoIncrement: true, primary: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'timestamp', notNull: true },

        content: { type: 'string', defaultValue: '' },
        slug: { type: 'string', notNull: true, unique: true },
        title: { type: 'string', notNull: true },
      }),
      queries.autoGenerateUuid(db, 'pages'), // Generate uuid on create
      queries.autoGenerateCreated(db, 'pages'), // Generate created on create
      db.runSql.bind(
        db,
        `
        INSERT into pages (slug, title, content)
        VALUES ('/', 'Front page', '');
        `,
      ),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'pages')], callback);
};

exports._meta = {
  version: 1,
};
