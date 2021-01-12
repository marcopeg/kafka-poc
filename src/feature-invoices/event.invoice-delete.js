const createInvoiceDeleteEvent = ({ query, emitJSON, publish }) => async ({
  request,
  payload,
}) => {
  const { invoiceId } = payload;

  const invoices = await query(`
    DELETE FROM "invoices_list"
    WHERE id = ${invoiceId}
    RETURNING *
  `);

  if (invoices.rowCount) {
    await emitJSON('deleted@poc-invoices', invoices.rows[0]);
    publish(request.id, invoices.rows[0]);
  }
};

module.exports = createInvoiceDeleteEvent;
