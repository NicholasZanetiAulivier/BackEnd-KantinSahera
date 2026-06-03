const pg = require('pg');
const config = require('../core/config');

let configs = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    // connectionString: config.database.connectionString,
    ssl: config.database.ssl ? {
        rejectUnauthorized: true,
        ca: config.database.certificate,
    } : null,
}

if (config.database.connectionString) {
    configs = {
        connectionString: config.database.connectionString
    }
}

const CONNECTION_CONFIGURATION = configs

let db = new pg.Pool(CONNECTION_CONFIGURATION);
db.connect(function (err) {
    if (err) {
        console.log(err);
        throw err;
    }
    db.query("SELECT VERSION()", [], function (err, result) {
        if (err) {
            throw err;
        }
        // logger.info("Database is connected");
        // console.log(result.rows[0]);
        // db.end(function (err) {
        //     if (err) throw err;
        // });
    });
});


db.on('error', (err, client) => {
    console.log(err);
})
module.exports = db;