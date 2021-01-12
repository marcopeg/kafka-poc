const createInvoiceCreateEvent = ({ query, emitJSON, publish }) => async ({
  request,
  payload,
}) => {
  const { user_id, user_name, amount } = payload;
  const invoice = await query(
    `INSERT INTO "invoices_list"
    ("user_id", "user_name", "amount")
    VALUES ('${user_id}', '${user_name}', ${amount})
    RETURNING *`,
  );

  await emitJSON('created@poc-invoices', invoice.rows[0]);
  publish(request.id, invoice.rows[0]);
};

module.exports = createInvoiceCreateEvent;
