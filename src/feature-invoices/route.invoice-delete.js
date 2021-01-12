const makeInvoiceDeleteHandler = ({ query, emitJSON, createTask }) => async (
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

  await emitJSON('delete@poc-invoices', {
    request: createTask(($) => reply.send($)),
    payload: { invoiceId },
  });
};

module.exports = makeInvoiceDeleteHandler;
