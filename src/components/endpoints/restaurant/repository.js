const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');
const logger = require('../../../core/logger')('menu-repository')

async function getSchedule(days = []) {
    console.log(days);
    let res, clientref;

    let query = "SELECT * FROM restaurant_schedules";
    if (days.length > 0) {
        let prepared = [];
        for (let i = 1; i <= days.length; i++) {
            prepared.push("$" + i);
        }
        query += `WHERE day_name IN (${prepared.join(',')});`;
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            query,
            days
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getContacts() {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM restaurant_datas WHERE key='contacts'"
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getPhysicalRestaurantData() {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM restaurant_datas WHERE key IN ('physical_open','physical_close','physical_day_closed')", //Technically bisa pake LIKE karena semua physical_..., tapi biar jelas di service apa yg bisa diakses aja
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getAddress() {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM restaurant_datas WHERE key='address'"
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getStatus() {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM restaurant_datas WHERE key='status'"
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function setStatus(status) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "UPDATE restaurant_datas SET value = $1 WHERE key = 'status'",
            [status]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di restaurant!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function setSchedule(schedule) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query("BEGIN");

        for (let day of schedule) {
            let c = 1;
            let sets = [];
            let add = [];
            for (let key in day) {
                if (key === 'day_name') continue;
                sets.push(key + " = " + "$" + c++);
                add.push(day[key]);
            }
            add.push(day.day_name);
            if (sets.length > 0) {
                await client.query(
                    "UPDATE restaurant_schedules SET " + sets.join(',') + " WHERE day_name = $" + c,
                    add
                );
            }
        }
        await client.query("COMMIT");
    }).then(result => {
        res = result
    }).catch(async (err) => {
        await clientref.query("ROLLBACK");
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });

    return res;
}

async function setContacts(contacts) {
    let res, clientref;

    let s = contacts.join('|');

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "UPDATE restaurant_datas SET value = $1 WHERE key = 'contacts'",
            [s]
        );
    }).then(result => {
        res = result
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function setPhysical(physical_place) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;

        for (let key in physical_place) {
            await client.query(
                "UPDATE restaurant_datas SET value = $1 WHERE key = $2 ",
                [key === 'day_closed' ? physical_place[key].join('|') : physical_place[key], "physical_" + key] // Simple way to do it, definitely guaranteed because of Joi validation
            );
        }
    }).then(result => {
        res = result
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function setAddress(address) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "UPDATE restaurant_datas SET value = $1 WHERE key = 'address'",
            [address]
        );
    }).then(result => {
        res = result
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

module.exports = {
    getSchedule,
    getContacts,
    getPhysicalRestaurantData,
    getAddress,
    getStatus,
    setStatus,
    setSchedule,
    setContacts,
    setPhysical,
    setAddress
}