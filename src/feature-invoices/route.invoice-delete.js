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

  // Create an async task to apply the change to the syste
  // and being able to send out a transactional output to the user:
  await createTask({
    onComplete: ($) => reply.send($),
    event: 'delete@poc-invoices',
    payload: { invoiceId },
  });
};

module.exports = makeInvoiceDeleteHandler;
