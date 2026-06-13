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

            await client.query("DELETE FROM orders WHERE true;").catch((e) => console.log(e));
            await client.query("DELETE FROM carts WHERE true;").catch((e) => console.log(e));
            await client.query("DELETE FROM menus WHERE true;").catch((e) => console.log(e));
            await client.query("DELETE FROM order_items WHERE true;").catch((e) => console.log(e));
            await client.query("COMMIT");
            console.log("---Cleanup finished---");
        })
        .catch(async (err) => {
            await client.query("ROLLBACK");
            console.log(err);
        })
        .finally(async () => await client.release());

    process.exit(0);
}

main();
