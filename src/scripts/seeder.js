const db = require("../database/db");
const { hashPassword } = require("../utils/password");
const config = require("../core/config");

const days = [
  { day: "monday", open: "07:00:00", close: "16:00:00" },
  { day: "tuesday", open: "07:00:00", close: "16:00:00" },
  { day: "wednesday", open: "07:00:00", close: "16:00:00" },
  { day: "thursday", open: "07:00:00", close: "16:00:00" },
  { day: "friday", open: "07:00:00", close: "16:00:00" },
  { day: "saturday", open: "07:00:00", close: "16:00:00" },
  { day: "sunday", open: "07:00:00", close: "16:00:00" },
];

async function main() {
  const randPrices = [5000, 25000, 3000, 22000, 26000];
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  const image_url =
    "https://res.cloudinary.com/dmzqupudd/image/upload/v1775628050/samples/dessert-on-a-plate.jpg";
  const n = randPrices.length;

  let client;
  await db
    .connect()
    .then(async (c) => {
      client = c;
      await client.query("BEGIN");
      // dummy food data
      for (let i = 0; i < 20; i++) {
        let name = `Food ${i + 1}`;
        let price = randPrices[getRandomInt(n, 0)];
        await client.query(
          `INSERT INTO menus (name, image_url, price) VALUES ($1, $2, $3)`,
          [name, image_url, price],
        );
      }
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

      //Temp, move to seeder if needed. (Restaurant Schedule)
      for (const p of days) {
        await client.query(
          "INSERT INTO restaurant_schedules (day_name , open_time, close_time) VALUES ($1,$2,$3)",
          [p.day, p.open, p.close],
        );
      }

      //Temp, move to seeder if needed. (Restaurant Data)
      //Proof of concept (contacts)
      const contacts = ["+6289765427865", "089765427865"];
      await client.query(
        "INSERT INTO restaurant_datas (key , value) VALUES ('contacts' , $1 )",
        [contacts.join("|")],
      ); // contacts: +62...|08...|... and so on
      const address = "sebelah untar";
      await client.query(
        "INSERT INTO restaurant_datas (key , value) VALUES ('address' , $1 )",
        [address],
      ); //address: sebelah untar, address single valued di sini, klo mau diganti, tinggal ganti algonya kayak contacts
      // single valued aja biar gak ribet

      const physicalOpen = "07:00:00";
      const physicalClose = "19:00:00";
      const physicalDayClosed = ["saturday", "sunday"];

      await client.query(
        "INSERT INTO restaurant_datas (key,value) VALUES ('physical_open' , $1)",
        [physicalOpen],
      ); // physical_open: 07:00:00
      await client.query(
        "INSERT INTO restaurant_datas (key,value) VALUES ('physical_close' , $1)",
        [physicalClose],
      ); // physical_close: 19:00:00
      await client.query(
        "INSERT INTO restaurant_datas (key,value) VALUES ('physical_day_closed' , $1)",
        [physicalDayClosed.join("|")],
      ); //physical_day_closed: saturday|sunday|... and so on

      await client.query(
        "INSERT INTO restaurant_datas (key,value) VALUES ('status' , $1)",
        ["closed"],
      ); // status: open
      await client.query(
        "INSERT INTO restaurant_datas (key,value) VALUES ('fee' , $1)",
        ["2000"],
      ); // status: open

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
