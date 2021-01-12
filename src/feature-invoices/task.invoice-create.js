const createInvoiceCreateTask = ({ query, emitJSON }) => async (payload) => {
  const { user_id, user_name, amount } = payload;
  const result = await query(
    `INSERT INTO "invoices_list"
      ("user_id", "user_name", "amount")
      VALUES ('${user_id}', '${user_name}', ${amount})
      RETURNING *`,
  );

  await emitJSON('created@poc-invoices', result.rows[0]);
  return result.rows[0];
};

module.exports = createInvoiceCreateTask;
