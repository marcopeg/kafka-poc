const makeInvoiceCreateHandler = ({ query, createTask }) => async (
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

  // Create an async task to apply the change to the syste
  // and being able to send out a transactional output to the user:
  createTask(reply, {
    event: 'create@poc-invoices',
    payload: {
      user_id,
      user_name: user.name,
      amount,
    },
  });
};

module.exports = makeInvoiceCreateHandler;
