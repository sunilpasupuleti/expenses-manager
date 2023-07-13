import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
import { styled } from "styled-components";
import { animated, useSpring } from "@react-spring/web";

const LogoContainer = styled.div`
  background-color: var(--primary);
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoImage = styled(animated.img)`
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

const MainContainer = styled.div`
  height: 100vh;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const AccountDeletion = ({ title }) => {
  const logoImageSprings = useSpring({
    from: { x: -250 },
    to: { x: 0 },
  });

  return (
    <Grid container>
      <Grid item md={6}>
        <LogoContainer>
          <LogoImage
            style={{ ...logoImageSprings }}
            alt="logo Image"
            src={require("../../assets/account-deletion.jpg")}
          />
        </LogoContainer>
      </Grid>
      <Grid item md={6}>
        <MainContainer>
          <Outlet />
        </MainContainer>
      </Grid>
    </Grid>
  );
};
