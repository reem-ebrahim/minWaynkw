const router = require("express").Router();

const { auth } = require("../../Middleware/auth");
const { validate } = require("../../Middleware/validation");
const { endpoint } = require("./controler/notification.endpoint");

const {
  createAdminNotification,
  getMyNotifications,
  markAsRead,
  deleteNotificationById,
  deleteAllNotifications,
} = require("./controler/notification.service");

const {
  createAdminNotificationSchema,
  notificationIdSchema,
} = require("./controler/notification.valid");

/* ================= ADMIN CREATE NOTIFICATION ================= */
router.post(
  "/admin",
  auth(endpoint.adminNotification),
  validate(createAdminNotificationSchema),
  createAdminNotification
);

/* ================= GET MY NOTIFICATIONS ================= */
router.get("/", auth(endpoint.AllUser), getMyNotifications);

/* ================= MARK AS READ ================= */
router.patch(
  "/:id/read",
  auth(endpoint.AllUser),
  validate(notificationIdSchema),
  markAsRead
);

/* ================= DELETE SINGLE NOTIFICATION ================= */
router.delete(
  "/:id",
  auth(endpoint.AllUser),
  validate(notificationIdSchema),
  deleteNotificationById
);

/* ================= DELETE ALL NOTIFICATIONS ================= */
router.delete("/", auth(endpoint.AllUser), deleteAllNotifications);

module.exports = router;
