import { Box, Grid, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { styled } from "styled-components";
import { AuthenticationContext } from "../../services/Authentication/Authentication.context";
import { LoadingButton } from "@mui/lab";
import SignInIcon from "@mui/icons-material/Login";
import { animated, useSpring } from "@react-spring/web";

const errors = {
  emailRequired: "Email required",
  passwordRequired: "Password required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  email: {
    ...commonInputFieldProps,
  },
  password: {
    ...commonInputFieldProps,
  },
};

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
  height: 500px;
  width: 500px;
`;

const LoginContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const TitleContainer = styled(animated.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const WalletImageContainer = styled.div`
  height: 100px;
  width: 100px;
  border-radius: 50px;
  @media (max-width: 768px) {
    height: 60px;
    width: 60px;
  }
`;

const WalletImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  border-radius: 50px;
  object-fit: cover;
`;

const Title = styled.h1`
  font-size: 28px;
`;

export const Admin = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  let redirect = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);

  const { onSignin, userData } = useContext(AuthenticationContext);

  const logoImageSprings = useSpring({
    from: { x: -250 },
    to: { x: 0 },
  });

  const titleContainerSprings = useSpring({
    from: { y: -350 },
    to: { y: 0 },
  });

  const formContainerSprings = useSpring({
    from: { x: 250 },
    to: { x: 0 },
  });
  const onValueChangeHandler = (e) => {
    const { name, value } = e.target;
    setInputs((prevState) => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        error: false,
        errorMessage: "",
        value,
      },
    }));
  };

  const onSubmitForm = (e) => {
    e.preventDefault();

    let hadErrors = false;
    const setErrorMessage = (name, message) => {
      setInputs((prevState) => ({
        ...prevState,
        [name]: {
          ...prevState[name],
          error: true,
          errorMessage: message,
        },
      }));
      hadErrors = true;
    };

    const { email, password } = inputs;

    if (!email.value.trim()) {
      setErrorMessage("email", errors.emailRequired);
    }
    if (!password.value.trim()) {
      setErrorMessage("password", errors.passwordRequired);
    }

    let data = {
      email: email.value.trim(),
      password: password.value,
    };
    if (!hadErrors) {
      setLoading(true);
      onSignin(
        data,
        () => {
          setLoading(false);
          redirect ? navigate("/" + redirect) : navigate("/dashboard/users");
        },
        () => {
          setLoading(false);
        },
        false,
        true
      );
    }
  };

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    if (userData) {
      navigate("/dashboard/send-notifications");
    }
  }, [userData]);

  return (
    <Grid container>
      <Grid item md={6}>
        <LogoContainer>
          <LogoImage
            style={{ ...logoImageSprings }}
            alt="logo Image"
            src={require("../../assets/logo.png")}
          />
        </LogoContainer>
      </Grid>
      <Grid item md={6}>
        <LoginContainer>
          <TitleContainer style={{ ...titleContainerSprings }}>
            <WalletImageContainer>
              <WalletImage
                alt="Wallet Image"
                src={require("../../assets/icon.jpeg")}
              />
            </WalletImageContainer>
            <Title>Expenses Manager</Title>
          </TitleContainer>

          <animated.div style={{ ...formContainerSprings }}>
            <Box
              component="form"
              noValidate
              onSubmit={onSubmitForm.bind(this)}
              sx={{ mt: 5 }}
            >
              <TextField
                error={inputs.email.error}
                helperText={inputs.email.errorMessage}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={inputs.email.value}
                onChange={onValueChangeHandler}
              />

              <TextField
                error={inputs.password.error}
                helperText={inputs.password.errorMessage}
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                name="password"
                type="password"
                value={inputs.password.value}
                onChange={onValueChangeHandler}
              />
              <LoadingButton
                type="submit"
                fullWidth
                loadingPosition="end"
                endIcon={<SignInIcon />}
                color="primary"
                loading={loading}
                loadingIndicator={"Authenticating..."}
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                {!loading && "Sign In"}
              </LoadingButton>
            </Box>
          </animated.div>
        </LoginContainer>
      </Grid>
    </Grid>
  );
};
