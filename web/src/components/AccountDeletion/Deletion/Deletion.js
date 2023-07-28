import { Box, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { styled } from "styled-components";
import { LoadingButton } from "@mui/lab";
import SubmitIcon from "@mui/icons-material/Send";
import { animated, useSpring } from "@react-spring/web";
import { AccountDeletionContext } from "../../../services/AccountDeletion/AccountDeletion.context";

const errors = {
  accountKeyRequired: "Account Key required",
  reasonRequired: "Reason required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  accountKey: {
    ...commonInputFieldProps,
  },
  reason: {
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
  color: ${(props) => (props.status === "success" ? "#198754;" : "tomato;")};
`;

const Deletion = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [inputs, setInputs] = useState(defaultInputState);

  const [loading, setLoading] = useState(false);

  const { onCreateRequest } = useContext(AccountDeletionContext);

  const [requestId, setRequestId] = useState(null);

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
    setRequestId(null);
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

    let { accountKey, reason } = inputs;

    if (!accountKey.value.trim()) {
      setErrorMessage("accountKey", errors.accountKeyRequired);
    }
    if (!reason.value.trim()) {
      setErrorMessage("reason", errors.reasonRequired);
    }
    accountKey = accountKey.value.trim();

    let data = {
      reason: reason.value,
    };

    if (!hadErrors) {
      setLoading(true);
      onCreateRequest(
        accountKey,
        data,
        (data) => {
          if (data && data.requestId) {
            setMessage({
              status: "success",
              message: data?.message,
            });
            setRequestId(data.requestId);
          }
          setInputs(defaultInputState);
          navigate("/account-deletion");
          setLoading(false);
        },
        (data) => {
          setMessage({
            status: "error",
            message: data?.message,
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
              {message.message} <br />
              {requestId && `Note your Request ID to track the status : `}
              <strong style={{ textTransform: "uppercase" }}>
                {requestId}
              </strong>
            </Message>
          )}

          <TextField
            placeholder="Check your account key in the app settings."
            error={inputs.accountKey.error}
            helperText={inputs.accountKey.errorMessage}
            margin="normal"
            required
            fullWidth
            id="accountKey"
            label="Account Key"
            name="accountKey"
            value={inputs.accountKey.value}
            onChange={onValueChangeHandler}
          />

          <TextField
            error={inputs.reason.error}
            multiline
            placeholder="Enter the reason why you want to delete?"
            minRows={5}
            helperText={inputs.reason.errorMessage}
            margin="normal"
            required
            fullWidth
            id="reason"
            label="Reason"
            name="reason"
            type="reason"
            value={inputs.reason.value}
            onChange={onValueChangeHandler}
          />
          <LoadingButton
            type="submit"
            fullWidth
            loadingPosition="end"
            endIcon={<SubmitIcon />}
            color="primary"
            loading={loading}
            loadingIndicator={"SUBMITTING..."}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {!loading && "SUBMIT REQUEST"}
          </LoadingButton>
          <Link
            to={"/account-deletion/status"}
            style={{
              color: "var(--primary)",
              textDecoration: "underline",
              float: "right",
              marginTop: 5,
            }}
          >
            Want to check Deletion status? Click here
          </Link>
        </Box>
      </animated.div>
    </>
  );
};

export default Deletion;
