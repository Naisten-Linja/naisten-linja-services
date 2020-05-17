module.exports = {
  // Add uuid-ossp extension to support generating uuid
  addUuidOsspExtension(db) {
    return db.runSql.bind(db, 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  },

  // Create function set_updated_time() to be used in triggers
  createSetUpdatedTimeFunction(db) {
    return db.runSql.bind(
      db,
      `
      CREATE OR REPLACE FUNCTION set_updated_time() RETURNS TRIGGER
      AS
      $BODY$
      BEGIN
         new.updated := CURRENT_TIMESTAMP;
         RETURN new;
      END;
      $BODY$
      LANGUAGE plpgsql;
      `,
    );
  },

  // Automatically generate uuid value on CREATE.
  // Requires 'uuid' to be defined in the table schema.
  autoGenerateUuid(db, table) {
    return db.runSql.bind(
      db,
      `
      ALTER TABLE ONLY ${table}
        ALTER COLUMN uuid SET DEFAULT uuid_generate_v4();
      `,
    );
  },

  // Requires 'created' to be defined in the table schema.
  autoGenerateCreated(db, table) {
    return db.runSql.bind(
      db,
      `
      ALTER TABLE ONLY ${table}
        ALTER COLUMN created SET DEFAULT CURRENT_TIMESTAMP;
      `,
    );
  },

  // Requires 'updated' to be defined in the table schema.
  autoGenerateUpdated(db, table) {
    return db.runSql.bind(
      db,
      `
      CREATE TRIGGER trigger_${table}_updated
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_time();
      `,
    );
  },
};
