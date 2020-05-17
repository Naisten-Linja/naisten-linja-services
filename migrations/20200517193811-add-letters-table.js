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
      db.createTable.bind(db, 'letters', {
        id: { type: 'int', primaryKey: true, autoIncrement: true },
        uuid: { type: 'string', notNull: true, unique: true },
        accessKey: { type: 'string', notNull: true, unique: true },
        accessPassword: { type: 'string', notNull: true },
        title: { type: 'string', notNull: true },
        assignedResponderId: {
          type: 'int',
          unsigned: true,
          foreignKey: {
            name: 'letters_users_id_fk',
            table: 'users',
            mapping: 'id',
            rules: {
              onDelete: 'SET NULL',
            },
          },
        },
      }),

      db.createTable.bind(db, 'replies', {
        id: { type: 'int', primaryKey: true, autoIncrement: true },
        uuid: { type: 'string', notNull: true, unique: true },
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
        internalAuthorId: {
          type: 'int',
          unsigned: true,
          foreignKey: {
            name: 'replies_users_id_fk',
            table: 'users',
            mapping: 'id',
            rules: {
              onDelete: 'SET NULL',
            },
          },
        },

        letterId: {
          type: 'int',
          unsigned: true,
          notNull: true,
          foreignKey: {
            type: 'int',
            name: 'replies_letters_id_fk',
            table: 'letters',
            mapping: 'id',
            rules: {
              onDelete: 'CASCADE',
            },
          },
        },
      }),
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'letter_content'), db.dropTable.bind(db, 'letters')], callback);
};

exports._meta = {
  version: 1,
};
