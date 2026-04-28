const db = require('../database/db');

tables = {
    user: `CREATE TABLE IF NOT EXISTS user(
        user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        google_id VARCHAR,
        email VARCHAR(345) UNIQUE NOT NULL,
        verified BOOLEAN NOT NULL,
        password VARCHAR NOT NULL,
        phone_no VARCHAR(16) NOT NULL,
    );`,
    order: `CREATE TABLE IF NOT EXISTS order(
        order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        total_price DECIMAL(9,2) NOT NULL CHECK (total_price >= 0),
        location VARCHAR,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        paid BOOLEAN NOT NULL DEFAULT false,
        fulfilled BOOLEAN NOT NULL DEFAULT false,
        note VARCHAR(300),
        has_fee BOOLEAN NOT NULL,
        customer_id UUID REFERENCES user(user_id) ON DELETE CASCADE,
        is_takeaway BOOLEAN
    );`,
    menu: `CREATE TABLE IF NOT EXISTS menu(
        menu_id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        image_url VARCHAR,
        price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
        is_available BOOLEAN NOT NULL DEFAULT true
    );`,
    order_item: `CREATE TABLE IF NOT EXISTS order_item(
        order_id UUID REFERENCES order(order_id) ON DELETE CASCADE,
        menu_id SERIAL REFERENCES menu(menu_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity>0),

        PRIMARY KEY (order_id,menu_id)
    );`,
    cart: `CREATE TABLE IF NOT EXISTS cart(
        customer_id UUID REFERENCES user(user_id) ON DELETE CASCADE,
        menu_id SERIAL REFERENCES menu(menu_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity>0),

        PRIMARY KEY (customer_id,menu_id)
    );`,
    admin: `CREATE TABLE IF NOT EXISTS admin(
        admin_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        email VARCHAR(345) UNIQUE NOT NULL,
        verified BOOLEAN NOT NULL,
        password VARCHAR NOT NULL,
        super_admin BOOLEAN NOT NULL DEFAULT false,
        last_logged_in TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    restaurant_schedule: `CREATE TABLE IF NOT EXISTS restaurant_schedule(
        day VARCHAR(10) NOT NULL PRIMARY KEY,
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        open BOOLEAN NOT NULL DEFAULT TRUE
    );`,
    restaurant_data: `CREATE TABLE IF NOT EXISTS restaurant_data(
        key VARCHAR NOT NULL PRIMARY KEY,
        value VARCHAR NOT NULL PRIMARY KEY
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
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        for (const i in tables) {
            await client.query(`DROP TABLE IF EXISTS ${i}`)
                .then(() => console.log(`Table ${i} has been dropped`))
                .catch((e) => console.log(`Error dropping table ${i}:\n ${e}`));
        }

        for (let tableName in tables) {
            const instruction = tables[tableName];
            await client.query(instruction)
                .then(() => console.log(`Table ${tableName} successfully created`))
                .catch((e) => console.log(`Error creating table ${tableName}:\n ${e}`));
        }

        console.log("Successfully Remigrated");
    }).catch((err) => console.log(err));
}

main();