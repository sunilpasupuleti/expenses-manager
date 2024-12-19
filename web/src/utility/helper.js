export function getFirebaseAccessUrl(path = "") {
  let URL =
    process.env.REACT_APP_FIREBASE_STORAGE_URL +
    path.replaceAll("/", "%2f") +
    "?alt=media";
  return URL;
}
