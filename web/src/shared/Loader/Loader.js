import styles from "./Loader.module.css";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { loaderActions } from "../../store/Loader.slice";
import { styled } from "styled-components";
import Lottie from "react-lottie";
import * as animationData from "../../assets/lottie/loading.json";

export const showLoader = (dispatch) => {
  dispatch(loaderActions.showLoader());
};

export const hideLoader = (dispatch) => {
  dispatch(loaderActions.hideLoader());
};

const portalElement = document.getElementById("loader-section");

const LottieContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 500px;
  width: 500px;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

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
        {ReactDOM.createPortal(
          <LottieContainer>
            <Lottie
              isClickToPauseDisabled
              options={{
                loop: true,
                autoplay: true,
                animationData: animationData,
              }}
            />
          </LottieContainer>,
          portalElement
        )}
      </>
    )
  );
};

export default Loader;
