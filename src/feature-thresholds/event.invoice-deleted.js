const createInvoiceDeletedEvent = ({ query, emitJSON }) => async ({
  user_id,
  ...payload
}) => {
  const results = await query(`
    INSERT INTO "thresholds" as "t1"
    ("user_id", "total")
    VALUES
    ('${user_id}', 0)
    ON CONFLICT ON CONSTRAINT thresholds_pkey
    DO UPDATE SET "total" = "t1"."total" - 1
    RETURNING *
  `);

  // @TODO: the threshold should be a parameter or something
  if (results.rows[0].total < 3) {
    await emitJSON('restored@poc-thresholds', results.rows[0]);
  }
};

module.exports = createInvoiceDeletedEvent;
