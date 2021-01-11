const makeInvoiceCreateHandler = ({ query, emitJSON }) => async (
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

  // Validate User Existance:
  const users = await query(
    `SELECT "name", "can_invoice" FROM "invoices_cache_users" WHERE id = '${user_id}'`,
  );
  if (!users.rowCount) {
    throw new Error('User not found');
  }

  // Validate User Can Emit Invoices:
  const user = users.rows[0];
  if (!user.can_invoice) {
    throw new Error(
      'Ooops, looks like you are out of invoices! Try to delete some data :-)',
    );
  }

  // Create the invoice record
  await emitJSON('create@poc-invoices', {
    user_id,
    user_name: user.name,
    amount,
  });

  reply.send('+ok');
};

module.exports = makeInvoiceCreateHandler;
