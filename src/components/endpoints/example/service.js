const repository = require('./repository');

async function getVersion() {
    const results = await repository.getVersion();
    return results.rows;
}

module.exports = {
    getVersion,
}