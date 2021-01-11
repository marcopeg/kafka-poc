const createInvoiceCreatedEvent = ({ query, emitJSON }) => async ({
  user_id,
}) => {
  const results = await query(`
    INSERT INTO "thresholds" as "t1"
    ("user_id", "total")
    VALUES
    ('${user_id}', 1)
    ON CONFLICT ON CONSTRAINT thresholds_pkey
    DO UPDATE SET "total" = "t1"."total" + 1
    RETURNING *
  `);

  // @TODO: the threshold should be a parameter or something
  if (results.rows[0].total >= 3) {
    await emitJSON('poc-thresholds', 'reached', results.rows[0]);
  }
};

module.exports = createInvoiceCreatedEvent;
