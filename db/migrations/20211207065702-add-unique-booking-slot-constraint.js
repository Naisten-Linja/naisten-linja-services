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
      db.removeColumn.bind(db, 'bookings', 'booking_type_name'),
      db.changeColumn.bind(db, 'bookings', 'user_uuid', {
        foreignKey: {
          name: 'bookings_users_uuid_fk',
          table: 'users',
          mapping: 'uuid',
          rules: {
            onDelete: 'CASCADE',
          },
        },
      }),
      db.changeColumn.bind(db, 'bookings', 'booking_type_uuid', {
        foreignKey: {
          name: 'bookings_users_uuid_fk',
          table: 'users',
          mapping: 'uuid',
          rules: {
            onDelete: 'RESTRICT',
          },
        },
      }),
      db.runSql.bind(
        db,
        'ALTER TABLE bookings ADD CONSTRAINT unique_booking_slot_constraint UNIQUE (booking_type_uuid, user_uuid, start_time, end_time);',
      ),
    ],
    callback,
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
