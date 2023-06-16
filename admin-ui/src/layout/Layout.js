import { Outlet, Route, Routes } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { Admin } from "../components/Admin/Admin";
import { Dashboard } from "../components/Admin/Dashboard/Dashboard";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";
import { PageNotFound } from "../components/NotFound/PageNotFound";
import { SendNotifications } from "../components/Admin/Dashboard/SendNotifications/SendNotifications";
import { NotificationContextProvider } from "../services/Notification/Notification.context";
const Layout = (props) => {
  const SendNotificationsElement = ({ title }) => {
    return (
      <NotificationContextProvider>
        <SendNotifications title={title} />
      </NotificationContextProvider>
    );
  };
  return (
    <SocketContextProvider>
      <AuthenticationContextProvider>
        <Routes>
          <Route path="/admin" element={<Admin title="Admin" />} />
          <Route
            path="/dashboard"
            element={
              <GetAuthGuard
                component={<Dashboard title="Dashboard" />}
                to={"/admin"}
              />
            }
          >
            <Route
              path="send-notifications"
              element={<SendNotificationsElement title="Send Notifications" />}
            />
          </Route>
          <Route path="*" element={<PageNotFound title="Page Not Found" />} />
        </Routes>

        <main>
          <Outlet />
        </main>
      </AuthenticationContextProvider>
    </SocketContextProvider>
  );
};

export default Layout;
