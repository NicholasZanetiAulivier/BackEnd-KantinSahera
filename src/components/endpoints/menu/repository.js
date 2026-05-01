const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');

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
            throw errorResponder(errors.DB, "Can't insert to DB");
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
            throw errorResponder(errors.DB, "Can't update DB");
        }).finally(() => {
            clientref.release();
        });
    });


    return res;
}


module.exports = {
    createMenu,
    editMenu,
}