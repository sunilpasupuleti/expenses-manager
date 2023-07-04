import ReactDOM from "react-dom";
import { ToastContainer, Slide, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const portalElement = document.getElementById("notify-section");

export const showNotification = ({
  message = "",
  status = "error",
  extraProps = {},
}) => {
  let notify = toast.success;
  if (status === "success") {
    notify = toast.success;
  }
  if (status === "error") {
    notify = toast.error;
  }
  if (status === "warning") {
    notify = toast.warning;
  }
  if (status === "info") {
    notify = toast.info;
  }
  notify(message, extraProps);
};

export const hideNotification = () => {};

export const Notification = () => {
  const Toaster = () => {
    return (
      <ToastContainer
        position={"bottom-center"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={true}
        rtl={false}
        theme={"colored"}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
      ></ToastContainer>
    );
  };

  return <>{ReactDOM.createPortal(<Toaster></Toaster>, portalElement)}</>;
};
