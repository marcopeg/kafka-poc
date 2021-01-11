const createInvoiceDeleteEvent = ({ query, emitJSON }) => async ({
  invoiceId,
}) => {
  const invoices = await query(`
    DELETE FROM "invoices_list"
    WHERE id = ${invoiceId}
    RETURNING *
  `);

  if (invoices.rowCount) {
    await emitJSON('deleted@poc-invoices', invoices.rows[0]);
  }
};

module.exports = createInvoiceDeleteEvent;
