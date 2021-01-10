const makeGetUserTotalHandler = ({ query }) => async (request, reply) => {
  const { user_id } = request.params;
  if (!user_id) {
    throw new Error('user_id needed');
  }

  // Create the invoice record
  const thresholds = await query(
    `SELECT "total" FROM "thresholds" WHERE "user_id" = '${user_id}'`,
  );

  reply.send(thresholds.rows[0]);
};

module.exports = makeGetUserTotalHandler;
