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
    })
    .lean();
  const data = notifications.map((n) => {
    const date = new Date(n.createdAt);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // convert 0 -> 12

    return {
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      sender: n.sender,
      isRead: n.isRead,
      time: `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()} ${hours}:${minutes} ${ampm}`,
    };
  });
  return res.success("Notifications", data );
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
