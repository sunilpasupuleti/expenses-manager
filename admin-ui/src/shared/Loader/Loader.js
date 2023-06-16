import styles from "./Loader.module.css";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { loaderActions } from "../../store/Loader.slice";

export const showLoader = (dispatch) => {
  dispatch(loaderActions.showLoader());
};

export const hideLoader = (dispatch) => {
  dispatch(loaderActions.hideLoader());
};

const Backdrop = (props) => {
  return <div className={styles.backdrop}></div>;
};

const LoaderOverlay = () => {
  return <div className={styles.center} id={styles.loader}></div>;
};

const portalElement = document.getElementById("loader-section");

const Loader = () => {
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setScrollY(-window.scrollY);
      document.body.style.position = "fixed";
    } else {
      document.body.style.top = "";
      document.body.style.position = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
      setScrollY(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    isLoading && (
      <>
        {ReactDOM.createPortal(<Backdrop></Backdrop>, portalElement)}
        {ReactDOM.createPortal(<LoaderOverlay></LoaderOverlay>, portalElement)}
      </>
    )
  );
};

export default Loader;
