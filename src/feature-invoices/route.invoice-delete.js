const makeInvoiceDeleteHandler = ({ query, emitJSON }) => async (
  request,
  reply,
) => {
  const { invoiceId } = request.params;

  const invoices = await query(`
    DELETE FROM "invoices_list"
    WHERE id = ${invoiceId}
    RETURNING *
  `);

  if (!invoices.rowCount) {
    throw new Error('Invoice not found');
  }

  await emitJSON('poc-invoices', 'deleted', invoices.rows[0]);
  reply.send(invoices.rows[0]);
};

module.exports = makeInvoiceDeleteHandler;
