const db = require("../database/db");
const { hashPassword } = require("../utils/password");
const config = require("../core/config");

async function main() {
  let client;
  await db
    .connect()
    .then(async (c) => {
      client = c;
      await client.query("BEGIN");

      await client
        .query(
          `INSERT INTO admins (email, password, super_admin) VALUES ($1,$2,$3)`,
          [
            config.admin_account.email,
            await hashPassword(config.admin_account.password),
            true,
          ],
        )
        .then(() => console.log("Added super admin!"))
        .catch((e) => console.log("Failed to add super admin"));

      await client.query("COMMIT");
      console.log("---Seeding process finished---");
    })
    .catch(async (err) => {
      await client.query("ROLLBACK");
      console.log(err);
    })
    .finally(async () => await client.release());

  process.exit(0);
}

main();