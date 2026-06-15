const repository = require("./repository");
const adminPassport = require("../../middlewares/authentication");
const { errorResponder, errors } = require("../../../core/errors");

async function getCustomerCart(id, offset, limit) {
  const result = await repository.getCustomerCart(id, offset, limit);
  return result.rows;
}

async function checkItemInCustomerCart(id, menu_id) {
  const result = await repository.getItemInCustomerCart(id, menu_id);
  return result.rowCount > 0;
}

async function checkCustomerCartExists(id) {
  const result = await repository.getCustomerCart(id, null, null);
  return result.rows.length > 0; // ini error jg
}

async function addCustomerCartItem(id, menu_id, quantity) {
  const result = await repository.addCustomerCartItem(id, menu_id, quantity);
  return result.rows;
}

async function updateCustomerCartItem(id, menu_id, quantity) {
  const result = await repository.updateCustomerCartItem(id, menu_id, quantity);
  return result.rows;
}

async function deleteCustomerCartItem(id, menu_id) {
  const result = await repository.deleteCustomerCartItem(id, menu_id);
  return result.rows;
}

async function deleteCustomerCart(id) {
  const result = await repository.deleteCustomerCart(id);
  return result.rows;
}

async function getCartPrice(id, has_fee) {
  const price = await repository.getCartPrice(id, has_fee); //WE HAVE TO CHANGE THIS, CHECK FROM POSSIBLE LOCATIONS
  return price;
}

async function createOrder(
  id,
  building,
  floor,
  extra,
  note,
  has_fee,
  is_takeaway,
  name,
  phone_number,
) {
  const result = await repository.createOrder(
    id,
    building,
    floor,
    extra,
    note,
    has_fee,
    is_takeaway,
    name,
    phone_number,
  );

  return result;
}

async function getOrderByID(id) {
  const result = await repository.getOrderByID(id);
  if (!result || !result.rows || result.rows.length === 0) return null;
  const order = result.rows[0];
  const itemsResult = await repository.getItemsByOrderID(id);
  order.items = itemsResult ? itemsResult.rows : [];
  return order;
}

async function getOrderByUserID(id, isCompleted, offset, limit) {
  const result = await repository.getOrderByUserID(
    id,
    isCompleted,
    offset,
    limit,
  );

  const orders = result.rows

  for (const order of orders) {
    const items = await repository.getItemsByOrderID(order.order_id);

    order.items = items.rows
  }

  return orders;
}

async function getOrders(offset, limit, status) {
  const result = await repository.getOrders(offset, limit, status);
  const orders = result.rows;

  // menu yang dipesan (cart item jadi order item)
  for (const order of orders) {
    const items = await repository.getItemsByOrderID(order.order_id);

    order.items = items.rows
  }

  return orders;
}

async function updateOrderTransaction(order, transaction) {
  const statusRows = (await repository.getOrderStatus(order.invoice_number))
    .rows;
  if (!statusRows) return 0;
  const status = statusRows[0].order_status;
  if (status === "PENDING") {
    if (transaction.status === "SUCCESS") {
      return await repository.updateOrderTransaction(
        transaction.original_request_id,
        "PROCESSING",
      );
    } else {
      return await repository.updateOrderTransaction(
        transaction.original_request_id,
        "CANCELLED",
      );
    }
  }
  return [{}];
}

async function updateOrderStatus(order_id, status) {
  return await repository.updateOrderTransaction(order_id, status);
}

module.exports = {
  getCustomerCart,
  getCartPrice,
  checkItemInCustomerCart,
  checkCustomerCartExists,
  addCustomerCartItem,
  updateCustomerCartItem,
  deleteCustomerCartItem,
  deleteCustomerCart,
  createOrder,
  getOrderByID,
  getOrderByUserID,
  getOrders,
  updateOrderTransaction,
  updateOrderStatus,
};
