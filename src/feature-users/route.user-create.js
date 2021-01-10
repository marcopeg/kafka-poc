const makeUserCreateHandler = ({ query, emit }) => async (request, reply) => {
  const { id, name } = request.body;
  if (!id) {
    throw new Error('id needed');
  }
  if (!name) {
    throw new Error('name needed');
  }

  // Create the user record
  const users = await query(
    `INSERT INTO "users_list"
    VALUES ('${id}', '${name}')
    RETURNING *`,
  );

  await emit('created', users.rows[0]);
  reply.send('+ok');
};

module.exports = makeUserCreateHandler;
