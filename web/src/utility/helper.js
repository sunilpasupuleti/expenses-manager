export function getFirebaseAccessUrl(path = "") {
  let URL =
    process.env.REACT_APP_FIREBASE_STORAGE_URL +
    path.replaceAll("/", "%2f") +
    "?alt=media";
  return URL;
}

export const getFirebaseErrorMessage = (code) => {
  var message = null;

  switch (code) {
    case "auth/user-not-found":
      message = "User doesn't exist.";

      break;

    case "auth/email-already-exists":
      message = "Email already exist";

      break;

    case "auth/invalid-credential":
      message = "Invalid Credential";

      break;

    case "auth/invalid-email":
      message = "Invalid Email";

      break;

    case "auth/wrong-password":
      message = "Incorrect Password";

      break;

    case "auth/too-many-requests":
      message = "You're exceed the limit. Try again after sometime.";

      break;

    default:
      message = "Something went wrong " + code;

      break;
  }

  return message;
};
