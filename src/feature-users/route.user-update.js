const makeUserUpdateHandler = ({ query, emit }) => async (request, reply) => {
  const { id } = request.params;
  const { name } = request.body;
  if (!id) {
    throw new Error('id needed');
  }
  if (!name) {
    throw new Error('name needed');
  }

  await query(`UPDATE "users_list" SET name = '${name}' WHERE id = '${id}'`);
  await emit('updated', { id, name });

  reply.send('+ok');
};

module.exports = makeUserUpdateHandler;
