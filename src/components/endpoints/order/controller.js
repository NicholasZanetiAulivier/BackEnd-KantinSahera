const {
  errorResponder,
  errors,
  processJoiValidationError,
} = require("../../../core/errors");
const service = require("./service");
const validate = require("../../middlewares/validator");
const { parseUserId } = require("../../../utils/id-parser");
const {
  checkInteger,
  checkUserParamsTokenID,
} = require("../../../utils/checks");
const restaurantService = require("../restaurant/service");
const crypto = require("crypto");
const config = require("../../../core/config");
const { nonSnapSignature } = require("../../../utils/doku");

async function getCustomerCart(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);

    let { offset, limit } = req.query;

    if (offset) checkInteger(offset, 0, "Offset");
    if (limit) checkInteger(limit, 0, "Limit");

    const result = await service.getCustomerCart(id, offset, limit);
    return res.status(200).json({
      items: result,
      offset: new Number(offset),
      limit: new Number(limit),
    });
  } catch (err) {
    return next(err);
  }
}

async function addCustomerCartItem(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);

    const { error, value } = validate.cartItem(req.body);
    processJoiValidationError(error);

    const { menu_id, quantity } = value;

    if (await service.checkItemInCustomerCart(id, menu_id)) {
      throw errorResponder(
        errors.DB_DUPLICATE_CONFLICT,
        "Sudah ada item ini di dalam cart!, gunakan PATCH untuk mengupdate!",
      );
    }

    await service.addCustomerCartItem(id, menu_id, quantity);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function updateCustomerCartItem(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);
    const { menuid: menu_id } = req.params;

    const { error, value } = validate.cartItemQuantity(req.body);
    processJoiValidationError(error);

    const { quantity } = value;

    if (!(await service.checkItemInCustomerCart(id, menu_id))) {
      throw errorResponder(
        errors.UNPROCESSABLE_ENTITY,
        "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!",
      );
    }

    await service.updateCustomerCartItem(id, menu_id, quantity);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function deleteCustomerCartItem(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);
    const { menuid: menu_id } = req.params;

    if (!(await service.checkItemInCustomerCart(id, menu_id))) {
      throw errorResponder(
        errors.UNPROCESSABLE_ENTITY,
        "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!",
      );
    }

    await service.deleteCustomerCartItem(id, menu_id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function deleteCustomerCart(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);

    await service.deleteCustomerCart(id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

const feeBuildings = ["L", "J", "R"];

async function getCartPrice(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);
    const { building } = req.query;

    const price = await service.getCartPrice(
      id,
      building == undefined ? false : true,
    ); //We assume for now a flat fee. Although this should depend on the building
    return res.status(200).json({ price: price });
  } catch (err) {
    return next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);

    const { error, value } = validate.order(req.body);
    processJoiValidationError(error);

    let { building, floor, extra, note, name, phone_number } = value;

    let is_takeaway = true;
    if (building) {
      is_takeaway = false;
    }

    note = note || null;
    building = building || null;
    floor = floor || null;
    extra = extra || null;

    const restaurantStatus = await restaurantService.getRestaurantStatus();
    if (restaurantStatus.status === "close") {
      throw errorResponder(
        errors.SERVICE_UNAVAILABLE,
        "Restoran sedang tutup, tidak bisa melakukan pemesanan!",
      );
    }

    const exists = await service.checkCustomerCartExists(id);

    if (!exists) {
      throw errorResponder(
        errors.NOT_FOUND,
        "Tidak ada data cart untuk pengguna ini!",
      );
    }

    const result = await service.createOrder(
      id,
      building,
      floor,
      extra,
      note,
      feeBuildings.includes(building),
      is_takeaway,
      name,
      phone_number,
    );
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function getOrderByID(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.user.user_id;

    const order = await service.getOrderByID(orderId);

    const orderCustId = order.customer_id;

    if (!req.user.admin_id && userId !== orderCustId) {
      throw errorResponder(
        errors.INVALID_TOKEN,
        "Anda tidak diizinkan mengakses endpoint ini!",
      );
    }

    return res.status(200).json({ order: order });
  } catch (err) {
    return next(err);
  }
}

async function getOrderByUserID(req, res, next) {
  try {
    // frontend kan ngambil user id dari jwt dengan prefix user, so do it like this
    const id = parseUserId(req.params.id);

    const { offset, limit, completed } = req.query;

    const userId = parseUserId(req.user.user_id);

    let isCompleted = null; // DONT INITILIAZE UNDEFINED

    if (completed) isCompleted = completed === "true";

    let validId;
    if (req.user.user_id) {
      // checkUserParamsTokenID(req); // gak bisa kayak gini nikkkk
      validId = checkUserParamsTokenID(userId, id);
    }

    if (validId) {
      if (offset) checkInteger(offset, 0, "Offset");
      if (limit) checkInteger(limit, 0, "Limit");

      const result = await service.getOrderByUserID(
        userId,
        isCompleted,
        offset,
        limit,
      );
      return res.status(200).json({ orders: result });
    }
  } catch (err) {
    return next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    let { offset, limit, status } = req.query;

    if (offset) checkInteger(offset, 0, "Offset");
    if (limit) checkInteger(limit, 0, "Limit");

    const result = await service.getOrders(offset, limit, status);
    return res.status(200).json({ orders: result });
  } catch (err) {
    return next(err);
  }
}

const DOKU_TRANSACTION_STATUS = [
  "SUCCESS",
  "FAILED",
  "EXPIRED", //No need for "CANCELED" lets just disable it
];

async function handleNonSnapDokuNotifications(req, res, next) {
  try {
    const { order, transaction } = req.body;
    const clientID = req.get("Client-Id");
    const requestID = req.get("Request-Id");
    const timestamp = req.get("Request-Timestamp");
    const target = "/api/order/notifications/payments";

    const signature = await nonSnapSignature(
      req.body,
      clientID,
      requestID,
      timestamp,
      target,
    );
    const originSignature = req.get("Signature");

    // This doesnt work
    // if (!(signature === originSignature)) {
    //     throw errorResponder(errors.INVALID_TOKEN, "Signature does not match!");
    // }

    if (!order) {
      throw errorResponder(
        errors.INVALID_ARGUMENT,
        "Request body is missing order component",
      );
    }

    if (!transaction) {
      throw errorResponder(
        errors.INVALID_ARGUMENT,
        "Request body is missing transaction component",
      );
    }

    //We can check status through GET api after this, but honestly its kinda redundant (unless server key leaks)

    if (!DOKU_TRANSACTION_STATUS.includes(transaction.status)) {
      throw errorResponder(
        errors.BAD_REQUEST,
        "Transaction status is not valid",
      );
    }

    await service.updateOrderTransaction(order, transaction);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

const STATUS_ENUM = [
  "PENDING",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

async function updateOrderByID(req, res, next) {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status || !STATUS_ENUM.includes(status)) {
      throw errorResponder(
        errors.BAD_REQUEST,
        "Transaction status is not valid",
      );
    }
    
    await service.updateOrderStatus(orderId, status);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCustomerCart,
  getCartPrice,
  addCustomerCartItem,
  updateCustomerCartItem,
  deleteCustomerCartItem,
  deleteCustomerCart,
  createOrder,
  getOrderByID,
  getOrderByUserID,
  getOrders,
  handleNonSnapDokuNotifications,
  updateOrderByID,
};
