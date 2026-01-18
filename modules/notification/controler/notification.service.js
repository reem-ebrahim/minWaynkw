const notificationModel = require("../../../DB/models/notification.model");

module.exports.createAdminNotification = async (req, res) => {
  try {
    const { title, message, receiver } = req.body;

    const notification = await notificationModel.create({
      title,
      message,
      type: "admin",
      receiver,
      sender: req.user.id,
    });

    return res.success("Notification sent", notification);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.getMyNotifications = async (req, res) => {
  const notifications = await notificationModel
    .find({
      $or: [{ receiver: req.user.id }, { type: "banner" }],
    })
    .sort({ createdAt: -1 })

    .populate({
      path: "sender",
      select: "firstName lastName  nickName",
    });

  return res.success("Notifications", notifications);
};

module.exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  const notifById = await notificationModel
    .findById(id)
    .select("receiver isRead");

  if (!notifById) {
    return res.error("Notification not found (id does not exist)", null, 404);
  }

  if (notifById.receiver.toString() !== req.user.id.toString()) {
    return res.error("Not authorized to update this notification", null, 403);
  }

  notifById.isRead = true;
  await notifById.save();

  return res.success("Notification marked as read");
};

module.exports.deleteNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findOneAndDelete({
      _id: id,
      receiver: req.user.id, // 🔐 only owner can delete
    });

    if (!notification) return res.error("Notification not found", null, 404);

    return res.success("Notification deleted successfully");
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await notificationModel.deleteMany({
      receiver: req.user.id,
    });

    // 🔍 No notifications found for this user
    if (result.deletedCount === 0) {
      return res.error("No notifications found for this user", null, 404);
    }
    return res.success("All notifications deleted successfully");
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};
