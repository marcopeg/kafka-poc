const makeInvoiceDeleteHandler = ({ query, emitJSON }) => async (
  request,
  reply,
) => {
  const { invoiceId } = request.params;

  const invoices = await query(`
    SELECT * FROM "invoices_list"
    WHERE id = ${invoiceId}
    LIMIT 1
  `);

  if (!invoices.rowCount) {
    throw new Error('Invoice not found');
  }

  await emitJSON('delete@poc-invoices', { invoiceId });
  reply.send('+ok');
};

module.exports = makeInvoiceDeleteHandler;
