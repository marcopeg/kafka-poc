const createInvoiceCreateEvent = ({ query, emitJSON }) => async ({
  user_id,
  user_name,
  amount,
}) => {
  const invoice = await query(
    `INSERT INTO "invoices_list"
    ("user_id", "user_name", "amount")
    VALUES ('${user_id}', '${user_name}', ${amount})
    RETURNING *`,
  );

  await emitJSON('created@poc-invoices', invoice.rows[0]);
};

module.exports = createInvoiceCreateEvent;
