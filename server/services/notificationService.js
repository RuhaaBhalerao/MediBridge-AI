import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientId,
  senderId,
  claimId,
  type = "system",
  title,
  message,
}) => {
  if (!recipientId) {
    return null;
  }

  try {
    return await Notification.create({
      recipientId,
      senderId,
      claimId,
      type,
      title,
      message,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};