const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');
const { logger } = require('../../../core/logger');

async function getMenuByIDs(ids) {
    let res, clientref;

    prepared = []
    for (let i = 1; i < ids.length + 1; i++) {
        prepared.push("$" + i);
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT * FROM menus WHERE menu_id in (${prepared.join(",")})`,
            ids
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getMenuBySearch(offset, limit, search) {

    let query = "SELECT * FROM menus";
    let add = [];
    let c = 1;

    if (search) {
        query += " WHERE name ~* $" + c++;
        add.push(search);
    }
    query += ' ORDER BY menu_id '
    if (limit) {
        query += " LIMIT $" + c++;
        add.push(new Number(limit));
    }
    if (offset) {
        query += " OFFSET $" + c++;
        add.push(new Number(offset));
    }

    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            query + ';',
            add
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}
async function getMenuCount(search) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT COUNT(*) FROM menus ${search ? "WHERE name ~* $1" : ""};`,
            search ? [search] : []
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}


async function createMenu(name, image_url, price) {
    let res, clientref;

    imagePrompt = "";
    prepared = ['$1', '$2']
    add = [name, price];
    if (image_url) {
        imagePrompt = ", image_url";
        prepared.push('$3');
        add.splice(1, 0, image_url);
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO menus(name ${imagePrompt}, price) VALUES (${prepared.join(', ')}) RETURNING *`,
            add
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function editMenu(id, data) {
    let res, clientref;

    let query = "SELECT * FROM menus WHERE menu_id = $1;";
    let add = [];

    if (Object.keys(data).length > 0) {
        let prepared = [];
        let c = 1;
        for (let k in data) {
            prepared.push(k.toString() + " = $" + c++);
            add.push(data[k]);
        }

        query = "UPDATE menus SET " + prepared.join(", ") + " WHERE menu_id = $" + c + " RETURNING *;";
    }
    add.push(id);

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            query,
            add
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function deleteMenu(id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "DELETE FROM menus WHERE menu_id = $1",
            [id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

// beda query, karena count return satu row saja, sama kebanyakan sumber nyaranin bedain query
//  No, kalo querynya ini, dia return jumlah menu keseluruhan. Kita perluh menu yang udh difilter secara search
// Kalo kayak gini paginationnya fucked karena too many pages and too little menu data when filtered by search
async function countMenus(search) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT COUNT(DISTINCT(menus.menu_id)) AS count FROM menus " + (search ? "WHERE name ~* $1" : ""),
            (search ? [search] : [])
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di modul menu!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

module.exports = {
    getMenuByIDs,
    getMenuBySearch,
    getMenuCount,
    createMenu,
    editMenu,
    deleteMenu,
    countMenus,
}