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

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
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
