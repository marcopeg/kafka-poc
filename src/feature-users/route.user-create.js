const makeUserCreateHandler = ({ query, emitJSON }) => async (
  request,
  reply,
) => {
  // Validation phase:
  const { id, name } = request.body;
  if (!id) {
    throw new Error('id needed');
  }
  if (!name) {
    throw new Error('name needed');
  }

  // CRUD:
  const users = await query(
    `INSERT INTO "users_list"
    VALUES ('${id}', '${name}')
    RETURNING *`,
  );

  // Communication:
  await emitJSON('poc-users', 'created', users.rows[0]);
  reply.send(users.rows[0]);
};

module.exports = makeUserCreateHandler;
