export async function openDatabaseAsync(name) {
  return {
    async execAsync(sql) {},
    async runAsync(sql, params) {},
    async getAllAsync(sql, params) { return []; },
    async getFirstAsync(sql, params) { return null; },
    async withTransactionAsync(action) { return await action(); },
  };
}

