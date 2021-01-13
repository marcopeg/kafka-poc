const createInvoiceDeletedEvent = ({ query, emitJSON }) => async ({
  user_id,
  created_at,
  amount,
}) => {
  const date = new Date(created_at);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const results = await query(`
      UPDATE "totals" as "t1"
        SET "total" = "t1"."total" - ${amount}
      WHERE "user_id" = '${user_id}'
        AND "year" = ${year}
        AND "month" = ${month}
      RETURNING *
    `);

  if (results.rowCount) {
    await emitJSON('updated@poc-totals', results.rows[0]);
  }
};

module.exports = createInvoiceDeletedEvent;
