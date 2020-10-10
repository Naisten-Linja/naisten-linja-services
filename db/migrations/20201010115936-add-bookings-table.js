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
      db.createTable.bind(db, 'bookings', {
        id: { type: 'int', autoIncrement: true, primary: true },
        uuid: { type: 'string', notNull: true, unique: true },
        created: { type: 'timestamp', notNull: true },

        user_uuid: {
          type: 'string',
          foreignKey: {
            name: 'bookings_users_uuid_fk',
            table: 'users',
            mapping: 'uuid',
            rules: {
              onDelete: 'SET NULL',
            },
          },
        },

        booking_type_uuid: {
          type: 'string',
          foreignKey: {
            name: 'bookings_booking_types_uuid_fk',
            table: 'booking_types',
            mapping: 'uuid',
            rules: {
              onDelete: 'RESTRICT',
            },
          },
        },
        name: { type: 'string', notNull: true },
        email: { type: 'string', notNull: true },
        phone: { type: 'string', notNull: true },

        // Rules that set which dates are bookable and possible exceptions
        rules: { type: 'string', notNull: true },
      }),
      queries.autoGenerateUuid(db, 'bookings'), // Generate uuid on create
      queries.autoGenerateCreated(db, 'bookings'), // Generate created on create
    ],
    callback,
  );
};

exports.down = function (db, callback) {
  async.series([db.dropTable.bind(db, 'bookings')], callback);
};

exports._meta = {
  version: 1,
};
