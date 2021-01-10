const createUserCreatedEvent = ({ query }) => ({ id, name }) => {
  if (!id) return;
  if (!name) return;
  query(`
    INSERT INTO "invoices_cache_users"
    VALUES ('${id}', '${name}')
    ON CONFLICT ON CONSTRAINT "invoices_cache_users_pkey"
    DO NOTHING
`);
};

module.exports = createUserCreatedEvent;
