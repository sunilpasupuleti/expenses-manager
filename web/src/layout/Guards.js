import { Navigate } from "react-router-dom";
import { getLocalStorage } from "../services/LocalStorage.service";

export const GetAuthGuard = ({ component, to }) => {
  // const { loggedIn } = useContext(AuthenticationContext);
  let loggedIn = getLocalStorage("loggedIn");
  return loggedIn ? component : <Navigate to={to} />;
};
