const makeUsersListHandler = ({ query }) => async (request, reply) => {
  const results = await query(`SELECT * FROM "users_list"`);
  reply.send(results.rows);
};

module.exports = makeUsersListHandler;
