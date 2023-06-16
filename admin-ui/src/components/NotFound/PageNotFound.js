import styled from "styled-components";
import Lottie from "react-lottie";
import * as animationData from "../../assets/lottie/not_found.json";
import { useEffect } from "react";

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

export const PageNotFound = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);
  return (
    <LottieContainer>
      <Lottie
        isClickToPauseDisabled
        options={{
          loop: true,
          autoplay: true,
          animationData: animationData,
        }}
      />
    </LottieContainer>
  );
};
