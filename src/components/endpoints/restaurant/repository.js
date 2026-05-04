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

module.exports = {
    getSchedule,
    getContacts,
    getPhysicalRestaurantData,
    getAddress,
}