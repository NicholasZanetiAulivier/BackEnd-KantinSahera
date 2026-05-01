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


module.exports = {
    createMenu,
}