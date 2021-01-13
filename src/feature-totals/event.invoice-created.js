const createInvoiceCreatedEvent = ({ query, emitJSON }) => async ({
  user_id,
  created_at,
  amount,
}) => {
  const date = new Date(created_at);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const results = await query(`
    INSERT INTO "totals" as "t1"
    ("user_id", "year", "month", "total")
    VALUES
    ('${user_id}', ${year}, ${month}, ${amount})
    ON CONFLICT ON CONSTRAINT "totals_pkey"
    DO UPDATE SET "total" = "t1"."total" + ${amount}
    RETURNING *
  `);

  await emitJSON('updated@poc-totals', results.rows[0]);
};

module.exports = createInvoiceCreatedEvent;
