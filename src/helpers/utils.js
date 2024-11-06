import { Timestamp } from "firebase/firestore";
export const randomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedHours = hours % 12 || 12;
  const formattedMinutes = String(minutes).padStart(2, "0");

  const period = hours >= 12 ? "PM" : "AM";

  return `${formattedHours}:${formattedMinutes} ${period}`;
};

export const parseToUnixTimestamp = (timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }

  if (!isNaN(timestamp)) {
    return timestamp;
  }

  return null;
};
