const db = require('../database/db');
const { hashPassword } = require('../utils/password');

tables = {
    users: `CREATE TABLE IF NOT EXISTS users(
        user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        username VARCHAR(32),
        email VARCHAR(345) UNIQUE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        password VARCHAR,
        phone_no VARCHAR(16),
        profile_image_url VARCHAR(2048)
    );`,
    orders: `CREATE TABLE IF NOT EXISTS orders(
        order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        total_price DECIMAL(9,2) NOT NULL CHECK (total_price >= 0),
        location VARCHAR,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        paid BOOLEAN NOT NULL DEFAULT false,
        fulfilled BOOLEAN NOT NULL DEFAULT false,
        note VARCHAR(300),
        has_fee BOOLEAN NOT NULL,
        customer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        is_takeaway BOOLEAN
    );`,
    menus: `CREATE TABLE IF NOT EXISTS menus(
        menu_id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        image_url VARCHAR,
        price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
        is_available BOOLEAN NOT NULL DEFAULT true
    );`,
    order_items: `CREATE TABLE IF NOT EXISTS order_items(
        order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
        menu_id SERIAL REFERENCES menus(menu_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity>0),
        PRIMARY KEY (order_id,menu_id)
    );`,
    carts: `CREATE TABLE IF NOT EXISTS carts(
        customer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        menu_id SERIAL REFERENCES menus(menu_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity>0),

        PRIMARY KEY (customer_id,menu_id)
    );`,
    admins: `CREATE TABLE IF NOT EXISTS admins(
        admin_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(345) UNIQUE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        password VARCHAR NOT NULL,
        super_admin BOOLEAN NOT NULL DEFAULT false,
        last_logged_in TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    restaurant_schedules: `CREATE TABLE IF NOT EXISTS restaurant_schedules(
        day VARCHAR(10) NOT NULL PRIMARY KEY,
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        open BOOLEAN NOT NULL DEFAULT TRUE
    );`,
    restaurant_datas: `CREATE TABLE IF NOT EXISTS restaurant_datas(
        key VARCHAR NOT NULL PRIMARY KEY,
        value VARCHAR NOT NULL
    );`,
    earnings: `CREATE TABLE IF NOT EXISTS earnings(
        date DATE PRIMARY KEY,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        transaction_count INTEGER NOT NULL DEFAULT 0,

        CHECK (amount>=0 AND transaction_count>=0)
    );`,
}

async function main() {
    await db.connect().then(async (client) => {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        for (const i in tables) {
            await client.query(`DROP TABLE IF EXISTS ${i} CASCADE;`)
                .then(() => console.log(`Table ${i} has been dropped`))
                .catch((e) => console.log(`Error dropping table ${i}:\n ${e}`));
        }

        for (let tableName in tables) {
            const instruction = tables[tableName];
            await client.query(instruction)
                .then(() => console.log(`Table ${tableName} successfully created`))
                .catch((e) => console.log(`Error creating table ${tableName}:\n ${e}`));
        }

        await client.query(`INSERT INTO admins (email, password, super_admin) VALUES ($1,$2,$3)`, ["super@gmail.com", await hashPassword("admin"), true])
            .then(() => console.log("Added super admin!"))
            .catch((e) => console.log("Failed to add super admin"));//Temp, move to seeder if needed

        console.log("Successfully Remigrated");
    }).catch((err) => console.log(err));

    process.exit(0);
}

main();