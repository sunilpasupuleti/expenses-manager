import { Outlet, Route, Routes } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { Admin } from "../components/Admin/Admin";
import { Dashboard } from "../components/Admin/Dashboard/Dashboard";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";
import { PageNotFound } from "../components/NotFound/PageNotFound";
import { SendNotifications } from "../components/Admin/Dashboard/SendNotifications/SendNotifications";
import { NotificationContextProvider } from "../services/Notification/Notification.context";
import { UserContextProvider } from "../services/User/User.context";
import { Users } from "../components/Admin/Dashboard/Users/Users";
import { AccountDeletionContextProvider } from "../services/AccountDeletion/AccountDeletion.context";
import { Status } from "../components/AccountDeletion/Status/Status";
import { AccountDeletion } from "../components/AccountDeletion/AccountDeletion";
import { AccountDeletion as AdminAccountDeletion } from "../components/Admin/Dashboard/AccountDeletion/AccountDeletion";
import { Deletion } from "../components/AccountDeletion/Deletion/Deletion";

const Layout = (props) => {
  const SendNotificationsElement = ({ title }) => {
    return (
      <NotificationContextProvider>
        <SendNotifications title={title} />
      </NotificationContextProvider>
    );
  };

  const UsersElement = ({ title }) => {
    return (
      <UserContextProvider>
        <Users title={title} />
      </UserContextProvider>
    );
  };

  const AccountDeletionElement = ({ title }) => {
    return (
      <AccountDeletionContextProvider>
        <AccountDeletion title={title} />
      </AccountDeletionContextProvider>
    );
  };

  const AdminAccountDeletionElement = ({ title }) => {
    return (
      <AccountDeletionContextProvider>
        <AdminAccountDeletion title={title} />
      </AccountDeletionContextProvider>
    );
  };

  const DeletionElement = ({ title }) => {
    return (
      <AccountDeletionContextProvider>
        <Deletion title={title} />
      </AccountDeletionContextProvider>
    );
  };

  const StatusElement = ({ title }) => {
    return (
      <AccountDeletionContextProvider>
        <Status title={title} />
      </AccountDeletionContextProvider>
    );
  };

  return (
    <SocketContextProvider>
      <AuthenticationContextProvider>
        <Routes>
          <Route path="/" element={<Admin title="Admin" />} />
          <Route
            path="/account-deletion"
            element={<AccountDeletionElement title="Account Deletion" />}
          >
            <Route
              path=""
              element={<DeletionElement title="Account Deletion" />}
            />
            <Route
              path="status"
              element={<StatusElement title="Deletion Status" />}
            />
          </Route>

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
            <Route path="users" element={<UsersElement title="Users" />} />
            <Route
              path="account-deletion"
              element={<AdminAccountDeletionElement title="Account Deletion" />}
            />
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
