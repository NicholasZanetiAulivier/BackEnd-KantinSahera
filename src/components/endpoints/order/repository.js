const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');
const { logger } = require('../../../core/logger');
const config = require('../../../core/config');
const { createHash, createHmac } = require('crypto');

async function getCustomerCart(id, offset, limit) {
    let res, clientref;
    let offsetLimitString = "";
    let add = [id];
    let c = 2;
    if (limit) {
        offsetLimitString += `LIMIT $${c++}`;
        add.push(limit);
    }
    if (offset) {
        offsetLimitString += `OFFSET $${c++}`;
        add.push(offset);
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT quantity, carts.menu_id, name, image_url, price, is_available FROM carts 
                JOIN menus ON carts.menu_id=menus.menu_id WHERE carts.customer_id= $1 ${offsetLimitString}`,
            add
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getItemsByOrderID(id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT quantity, order_items.menu_id "menu_id", name, price FROM order_items 
                JOIN menus ON order_items.menu_id=menus.menu_id WHERE order_items.order_id= $1`,
            [id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function addCustomerCartItem(id, menu_id, quantity) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "INSERT INTO carts(customer_id , menu_id , quantity) VALUES ($1,$2,$3)",
            [id, menu_id, quantity]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function updateCustomerCartItem(id, menu_id, quantity) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "UPDATE carts SET quantity=$1 WHERE customer_id=$2 AND menu_id=$3",
            [quantity, id, menu_id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function deleteCustomerCartItem(id, menu_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "DELETE FROM carts WHERE customer_id=$1 AND menu_id=$2;",
            [id, menu_id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function deleteCustomerCart(id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "DELETE FROM carts WHERE customer_id=$1 ;",
            [id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getItemInCustomerCart(id, menu_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM carts WHERE customer_id = $1 AND menu_id = $2",
            [id, menu_id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getCartPrice(id, has_fee) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        let price = await client.query(
            `SELECT SUM(menus.price*carts.quantity) "total" FROM carts 
                JOIN menus ON carts.menu_id=menus.menu_id WHERE carts.customer_id=$1`,
            [id]
        ).then(result => new Number(result.rows[0].total));
        if (has_fee) {
            const parkingFee = await client.query(
                `SELECT NULLIF(value, '0') "value"  FROM restaurant_datas WHERE key ='fee'`
            ).then(result => new Number(result.rows[0].value));
            price += parkingFee;
        }
        return price;
    }).then(price => { res = price }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function createOrder(id, location, note, has_fee, is_takeaway) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;

        await client.query('BEGIN');

        let price = await getCartPrice(id, has_fee);
        let order = await client.query(`
            INSERT INTO orders(total_price,location,note,has_fee,customer_id,is_takeaway)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
            [price, location, note, has_fee, id, is_takeaway]
        ).then(results => results.rows[0]);

        await client.query(
            `WITH item_data AS (
                SELECT * FROM carts WHERE customer_id=$1
            ) INSERT INTO order_items(order_id , menu_id, quantity)
             SELECT $2, menu_id , quantity FROM item_data`,
            [id, order.order_id]
        ).then(result => {
            result
        });

        await client.query(
            `DELETE FROM carts WHERE customer_id=$1`,
            [id]
        );

        /*Doku request here so we can rollback if doku errors */
        const clientID = config.secret.doku_client_id;
        const requestID = "Create" + order.order_id;
        let date = new Date();
        const requestTimestamp = date.toISOString();

        const requestTarget = "/checkout/v1/payment";


        let body = {
            order: {
                amount: Math.ceil(order.total_price),
                invoice_number: "1829",
            },
            payment: {
                payment_due_date: 30,
                payment_method_types: ["QRIS"]
            }
        };

        const digest = createHash('sha256').update(JSON.stringify(body)).digest('base64');
        let rawSign = `Client-Id:${clientID}\nRequest-Id:${requestID}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
        const sign = createHmac('sha256', config.secret.doku_secret_key).update(rawSign).digest('base64');

        const headers = new Headers({
            "Content-Type": "application/json",
            "Client-Id": clientID,
            "Request-Id": requestID,
            "Request-TimeStamp": requestTimestamp,
            "Signature": "HMACSHA256=" + sign
        });

        console.log(`Client ID : ${clientID}`);
        console.log(`Request ID : ${requestID}`);
        console.log(`requestTimeStamp : ${requestTimestamp}`);
        console.log(`Body: ${body}`);
        console.log(`BodyJSON: ${JSON.stringify(body)}`);
        console.log(`digest: ${digest}`);
        console.log(`rawSIgn: ${rawSign}`);
        console.log(`sign: ${sign}`);
        /* If we want and have the time, we could finish the whole list of optional attributes */
        const dokuReturns = await fetch(
            "https://api-sandbox.doku.com/checkout/v1/payment", {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }
        ).then(async (res) => {
            if (res.status == 200) {
                return await res.json();
            } else {
                console.log(await res.json());
                console.log(res.status);
                throw errorResponder(errors.DOKU_BAD_REQUEST, "Transaksi tidak dibuat oleh Doku!");
            }
        }).catch(err => {
            throw errorResponder(errors.DOKU_BAD_REQUEST, "Error Doku!");
        });

        res = {
            order,
            payment: dokuReturns.payment
        };

        await client.query('COMMIT');
    }).catch(async (err) => {
        await clientref.query('ROLLBACK');
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getOrderByID(id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        let price = await client.query(
            `SELECT * FROM orders WHERE order_id = $1`,
            [id]
        ).then(result => {
            res = result;
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getOrderByUserID(id, offset, limit) {
    let res, clientref;
    let offsetLimitString = "";
    let add = [id];
    let c = 2;
    if (limit) {
        offsetLimitString += " LIMIT $" + c++;
        add.push(limit);
    }
    if (offset) {
        offsetLimitString += " OFFSET $" + c++;
        add.push(offset);
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM orders WHERE customer_id= $1" + offsetLimitString,
            add
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function updateOrderTransaction(order_id, transaction_id, status) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "UPDATE orders SET transaction_id = $1, transaction_status = $2 WHERE order_id = $3",
            [transaction_id, status, order_id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getOrders(offset, limit, paid, fulfilled) {
    let res, clientref;
    let offsetLimitString = "";
    let whereString = " WHERE ";
    let p;
    let add = [];
    let c = 1;

    if ((typeof paid) == 'boolean') {//No need for prepared statement here cuz these are definitely booleans
        whereString += ` transaction_status ${paid ? ' ' : ' NOT '} IN ('capture' , 'settlement') `;
        p = true;
    }
    if ((typeof fulfilled) == 'boolean') {
        whereString += ` ${p ? 'AND ' : ' '} fulfilled = ${fulfilled} `;
        p = true;
    }
    if (limit) {
        offsetLimitString += " LIMIT $" + c++;
        add.push(limit);
    }
    if (offset) {
        offsetLimitString += " OFFSET $" + c++;
        add.push(offset);
    }


    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM orders " + (p ? whereString : '') + offsetLimitString,
            add
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

module.exports = {
    getCustomerCart,
    getItemsByOrderID,
    getCartPrice,
    addCustomerCartItem,
    getItemInCustomerCart,
    updateCustomerCartItem,
    deleteCustomerCartItem,
    deleteCustomerCart,
    createOrder,
    getOrderByID,
    getOrderByUserID,
    getOrders,
    updateOrderTransaction,
}