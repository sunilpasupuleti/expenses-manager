import { Box, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { styled } from "styled-components";
import { LoadingButton } from "@mui/lab";
import StatusIcon from "@mui/icons-material/Autorenew";

import { animated, useSpring } from "@react-spring/web";
import { AccountDeletionContext } from "../../../services/AccountDeletion/AccountDeletion.context";

const errors = {
  idRequired: "Account Key or Request Id required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  id: {
    ...commonInputFieldProps,
  },
};

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

const Message = styled.h1`
  font-size: 15px;
  text-align: center;
  margin-bottom: 10px;
  color: ${(props) =>
    props.status === "success"
      ? "#198754;"
      : props.status === "info"
      ? "#5bc0de;"
      : "tomato;"};
`;

export const Status = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [inputs, setInputs] = useState(defaultInputState);

  const [loading, setLoading] = useState(false);

  const { onGetRequestStatus } = useContext(AccountDeletionContext);

  const [status, setStatus] = useState(null);

  const navigate = useNavigate();

  const [message, setMessage] = useState({
    message: null,
    status: null,
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
    setStatus(null);
    setMessage({
      message: null,
      status: null,
    });
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

    const { id } = inputs;

    if (!id.value.trim()) {
      setErrorMessage("id", errors.idRequired);
    }

    if (!hadErrors) {
      setLoading(true);
      onGetRequestStatus(
        id.value,
        (data) => {
          if (data && data.request) {
            let msg = data.message;
            let status = "success";
            let request = data.request;
            if (request.status === "rejected") {
              status = "error";
              msg = `Your submit request is rejected with reason ${request.rejectedReason}`;
            } else if (request.status === "pending") {
              status = "info";
              msg = `Your request is in process, you will be notified soon.`;
            } else if (request.status === "deleted") {
              msg = `Your data is completely deleted safely from our servers.`;
            } else {
              msg = "";
            }
            setStatus(data.request.status);
            setMessage({
              status: status,
              message: msg,
            });
          }
          setInputs(defaultInputState);
          navigate("/account-deletion/status");
          setLoading(false);
        },
        (error) => {
          setMessage({
            status: "error",
            message: error.message,
          });
          setLoading(false);
        },
        false,
        false
      );
    }
  };

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    let accountKey = searchParams.get("accountKey");
    if (searchParams && accountKey) {
      setInputs((p) => ({
        ...p,
        accountKey: {
          ...p.accountKey,
          value: accountKey,
        },
      }));
    }
  }, [searchParams]);

  return (
    <>
      <TitleContainer style={{ ...titleContainerSprings }}>
        <WalletImageContainer>
          <WalletImage
            alt="Wallet Image"
            src={require("../../../assets/icon.jpeg")}
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
          {message.message && (
            <Message status={message.status}>
              {status && `Status : `}
              <strong style={{ textTransform: "uppercase" }}>
                {status?.toUpperCase()}
              </strong>
              <br />
              {message.message}
            </Message>
          )}
          <TextField
            placeholder="Enter your Account Key or Request Id"
            error={inputs.id.error}
            helperText={inputs.id.errorMessage}
            margin="normal"
            required
            fullWidth
            id="id"
            label="Account Key or Request Id"
            name="id"
            value={inputs.id.value}
            onChange={onValueChangeHandler}
          />

          <LoadingButton
            type="submit"
            fullWidth
            loadingPosition="end"
            endIcon={<StatusIcon />}
            color="primary"
            loading={loading}
            loadingIndicator={"GETTING STATUS..."}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {!loading && "GET DELETION STATUS"}
          </LoadingButton>
        </Box>
      </animated.div>
    </>
  );
};
