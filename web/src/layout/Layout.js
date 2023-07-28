import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { Admin } from "../components/Admin/Admin";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";
import SendNotifications from "../components/Admin/Dashboard/SendNotifications/SendNotifications";
import { NotificationContextProvider } from "../services/Notification/Notification.context";
import { UserContextProvider } from "../services/User/User.context";
import { AccountDeletionContextProvider } from "../services/AccountDeletion/AccountDeletion.context";

import PageNotFound from "../components/NotFound/PageNotFound";
import Dashboard from "../components/Admin/Dashboard/Dashboard";
import Users from "../components/Admin/Dashboard/Users/Users";
import Status from "../components/AccountDeletion/Status/Status";
import AccountDeletion from "../components/AccountDeletion/AccountDeletion";
import AdminAccountDeletion from "../components/Admin/Dashboard/AccountDeletion/AccountDeletion";
import Deletion from "../components/AccountDeletion/Deletion/Deletion";
import Home from "../components/Home/Home";
import { AnimatePresence } from "framer-motion";

const Layout = (props) => {
  const location = useLocation();

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
        <AnimatePresence mode="wait">
          <Routes key={location.pathname} location={location}>
            <Route path="/" element={<Home title="Expenses Manager" />} />
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
                element={
                  <AdminAccountDeletionElement title="Account Deletion" />
                }
              />
              <Route
                path="send-notifications"
                element={
                  <SendNotificationsElement title="Send Notifications" />
                }
              />
            </Route>
            <Route path="*" element={<PageNotFound title="Page Not Found" />} />
          </Routes>

          <main>
            <Outlet />
          </main>
        </AnimatePresence>
      </AuthenticationContextProvider>
    </SocketContextProvider>
  );
};

export default Layout;
