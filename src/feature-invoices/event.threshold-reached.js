const createThresholdReachedEvent = ({ query }) => ({ user_id }) => {
  return query(`
    UPDATE "invoices_cache_users"
    SET "can_invoice" = false
    WHERE "id" = '${user_id}'
  `);
};

module.exports = createThresholdReachedEvent;
