describe('Basic tests', () => {
  beforeEach(global.resetSchema);

  it('Be able to create an invoice:', async () => {
    // Create user:
    const user = await global.post('/api/v1/users', {
      id: 'mp',
      name: 'Marco',
    });

    // Give the system time to reach eventual consistency:
    await global.pause(50);

    const invoice = await global.post('/api/v1/invoices', {
      user_id: user.id,
      amount: 100,
    });

    // Give the system time to reach eventual consistency:
    await global.pause(50);

    const query = `SELECT "total" from "public"."thresholds" WHERE "user_id" = '${user.id}'`;
    const result = await global.query(query);

    expect(result.rows[0].total).toBe(1);
  });

  it.skip('stress test', async () => {
    jest.setTimeout(1000 * 60 * 60);

    const limits = {
      users: 50,
      invoices: 50,
    };

    const users = [];
    const invoices = [];

    // Generate Users:
    for (let i = 0; i < limits.users; i++) {
      try {
        users.push(
          await global.post('/api/v1/users', {
            id: `urs-${global.random(1, 99999)}`,
            name: 'Marco',
          }),
        );
      } catch (err) {}
    }

    // Give the system time to reach eventual consistency:
    await global.pause(50);

    // Generate Invoices:
    for (let i = 0; i < limits.invoices; i++) {
      try {
        const payload = {
          user_id: global.randomItem(users).id,
          amount: global.random(0, 9999),
        };
        invoices.push(await global.post('/api/v1/invoices', payload));
      } catch (err) {
        console.log('Err invoice:', err.response.data.message);
      }
    }
  });
});
