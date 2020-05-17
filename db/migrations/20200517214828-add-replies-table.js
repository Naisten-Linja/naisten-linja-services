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
      db.createTable.bind(db, 'replies', {
        id: { type: 'int', primaryKey: true, autoIncrement: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'date', notNull: true },
        updated: { type: 'date', notNull: true },

        isPublished: { type: 'boolean', notNull: true, defaultValue: false },
        content: { type: 'string', notNull: true },

        // If the content was created by a Naisten Linja staff, this should be set to 'staff'
        // If created by the person who sent the letter, set to 'sender'
        authorType: { type: 'string', notNull: true }, // options: 'internal', 'sender'

        // TODO: clarify if this field is needed.
        // If the content is a reply by a Naisten Linja's staff or volunteer,
        // the responder's information is persisted here using their Full Name
        // and Email Address.
        // If the content is by the person who sent the letter, default to 'guest'
        // authorMeta: { type: 'string' },

        // If the letter is a reply by a Naisten Linja staff or volunteer,
        // this field is set with the user's ID. When the user is deleted,
        // this will automatially be set to null.
        // In case the reply was created by the person who sent the letter,
        // this should be set to NULL
        internalAuthorUuid: {
          type: 'string',
          foreignKey: {
            name: 'replies_users_uuid_fk',
            table: 'users',
            mapping: 'uuid',
            rules: {
              onDelete: 'SET NULL',
            },
          },
        },

        letterId: {
          type: 'string',
          notNull: true,
          foreignKey: {
            name: 'replies_letters_uuid_fk',
            table: 'letters',
            mapping: 'uuid',
            rules: {
              onDelete: 'CASCADE',
            },
          },
        },
      }),
      queries.autoGenerateUuid(db, 'replies'), // Generate uuid on create
      queries.autoGenerateCreated(db, 'replies'), // Generate created on create
      queries.autoGenerateUpdated(db, 'replies'), // Generate updated on update
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'replies')], callback);
};

exports._meta = {
  version: 1,
};
