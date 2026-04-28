const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');

// Yea ok we need to tidy this up

async function getVersion() {
    let res, clientref;
    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT VERSION()",
            []
        ).then(result => {
            res = result
        }).catch((err) => {
            throw errorResponder(errors.DB, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });
    return res;
}

module.exports = {
    getVersion,
}