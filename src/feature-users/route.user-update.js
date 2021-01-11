const makeUserUpdateHandler = ({ query, emitJSON }) => async (
  request,
  reply,
) => {
  const { id } = request.params;
  const { name } = request.body;
  if (!id) {
    throw new Error('id needed');
  }
  if (!name) {
    throw new Error('name needed');
  }

  const users = await query(
    `UPDATE "users_list" SET name = '${name}' WHERE id = '${id}' RETURNING *`,
  );

  await emitJSON('poc-users', 'updated', users.rows[0]);
  reply.send(users.rows[0]);
};

module.exports = makeUserUpdateHandler;
