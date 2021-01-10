const createUserCreatedEvent = ({ query }) => ({ id, name }) => {
  if (!id) return;
  if (!name) return;
  query(`
      UPDATE "invoices_cache_users"
      SET name = '${name}' WHERE id = '${id}'
  `);
};

module.exports = createUserCreatedEvent;
