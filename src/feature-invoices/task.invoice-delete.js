const createInvoiceDeleteTask = ({ query, emitJSON }) => async (payload) => {
  const { invoiceId } = payload;

  const result = await query(`
    DELETE FROM "invoices_list"
    WHERE id = ${invoiceId}
    RETURNING *
  `);

  await emitJSON('deleted@poc-invoices', result.rows[0]);
  return result.rows[0];
};

module.exports = createInvoiceDeleteTask;
