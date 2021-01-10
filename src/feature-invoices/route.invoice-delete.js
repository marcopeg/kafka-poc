const makeInvoiceDeleteHandler = ({ query, emit }) => async (
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

  await emit('deleted', invoices.rows[0]);
  reply.send('+ok');
};

module.exports = makeInvoiceDeleteHandler;
