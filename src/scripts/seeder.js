const db = require('../database/db');
const { hashPassword } = require('../utils/password');

const days = [
    { day: "monday", open: "07:00:00", close: "16:00:00" },
    { day: "tuesday", open: "07:00:00", close: "16:00:00" },
    { day: "wednesday", open: "07:00:00", close: "16:00:00" },
    { day: "thursday", open: "07:00:00", close: "16:00:00" },
    { day: "friday", open: "07:00:00", close: "16:00:00" },
    { day: "saturday", open: "07:00:00", close: "16:00:00" },
    { day: "sunday", open: "07:00:00", close: "16:00:00" }
]

async function main() {
    let client;
    await db.connect().then(async (c) => {
        client = c;
        await client.query("BEGIN");
        await client.query(`INSERT INTO admins (email, password, super_admin) VALUES ($1,$2,$3)`, ["super@gmail.com", await hashPassword("adminsahera123"), true])
            .then(() => console.log("Added super admin!"))
            .catch((e) => console.log("Failed to add super admin"));

        //Temp, move to seeder if needed. (Restaurant Schedule)
        for (const p of days) {
            await client.query("INSERT INTO restaurant_schedules (day_name , open_time, close_time) VALUES ($1,$2,$3)", [p.day, p.open, p.close]);
        }

        //Temp, move to seeder if needed. (Restaurant Data)
        //Proof of concept (contacts)
        const contacts = [
            "+6289765427865",
            "089765427865",
        ]
        await client.query("INSERT INTO restaurant_datas (key , value) VALUES ('contacts' , $1 )", [contacts.join("|")]); // contacts: +62...|08...|... and so on
        const address = "sebelah untar";
        await client.query("INSERT INTO restaurant_datas (key , value) VALUES ('address' , $1 )", [address]); //address: sebelah untar, address single valued di sini, klo mau diganti, tinggal ganti algonya kayak contacts

        const physicalOpen = "07:00:00";
        const physicalClose = "19:00:00";
        const physicalDayClosed = ["saturday", "sunday"];

        await client.query("INSERT INTO restaurant_datas (key,value) VALUES ('physical_open' , $1)", [physicalOpen]); // physical_open: 07:00:00
        await client.query("INSERT INTO restaurant_datas (key,value) VALUES ('physical_close' , $1)", [physicalClose]);// physical_close: 19:00:00
        await client.query("INSERT INTO restaurant_datas (key,value) VALUES ('physical_day_closed' , $1)", [physicalDayClosed.join('|')]); //physical_day_closed: saturday|sunday|... and so on
        await client.query("COMMIT");

        console.log("---Seeding process finished---")
    }).catch(async (err) => {
        await client.query("ROLLBACK");
        console.log(err);
    }).finally(async () => await client.release());

    process.exit(0)
}

main();