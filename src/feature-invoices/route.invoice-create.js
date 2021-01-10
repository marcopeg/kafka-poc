const makeInvoiceCreateHandler = ({ query, emit }) => async (
  request,
  reply,
) => {
  const { user_id, amount } = request.body;
  if (!user_id) {
    throw new Error('user_id needed');
  }
  if (!amount) {
    throw new Error('amount needed');
  }

  // Validate user id
  const users = await query(
    `SELECT "name", "can_invoice" FROM "invoices_cache_users" WHERE id = '${user_id}'`,
  );
  if (!users.rowCount) {
    throw new Error('User not found');
  }

  const user = users.rows[0];
  if (!user.can_invoice) {
    throw new Error(
      'Ooops, looks like you are out of invoices! Try to delete some data :-)',
    );
  }

  // Create the invoice record
  const invoice = await query(
    `INSERT INTO "invoices_list"
    ("user_id", "user_name", "amount")
    VALUES ('${user_id}', '${user.name}', ${amount})
    RETURNING *`,
  );

  await emit('created', invoice.rows[0]);
  reply.send('+ok');
};

module.exports = makeInvoiceCreateHandler;
