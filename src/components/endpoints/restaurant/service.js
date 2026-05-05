const repository = require('./repository');
const adminPassport = require('../../middlewares/authentication');

async function getRestaurantData() {
    const data = {};
    const schedule = await repository.getSchedule();
    data.schedule = schedule.rows;

    const contacts = await repository.getContacts();
    data.contacts = contacts.rows[0]["value"].split('|');

    const physical_sql = await repository.getPhysicalRestaurantData();
    const physical = {}
    for (const row of physical_sql.rows)
        physical[row['key'].substring(9)] = row['value'];
    physical['day_closed'] = physical['day_closed'].split('|');
    data.physical_place = physical;

    const address = await repository.getAddress();
    data.address = address.rows[0]["value"];

    data.status = await getRestaurantStatus();

    return data;
}

async function getRestaurantStatus() {
    const data = await repository.getStatus();

    return data.rows[0]['value'];
}

async function setStatus(status) {
    await repository.setStatus(status);
    return;
}

module.exports = {
    getRestaurantData,
    getRestaurantStatus,
    setStatus
}