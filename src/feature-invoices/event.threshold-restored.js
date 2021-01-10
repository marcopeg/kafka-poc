const createThresholdRestoredEvent = ({ query }) => ({ user_id }) => {
  return query(`
      UPDATE "invoices_cache_users"
      SET "can_invoice" = true
      WHERE "id" = '${user_id}'
    `);
};

module.exports = createThresholdRestoredEvent;
