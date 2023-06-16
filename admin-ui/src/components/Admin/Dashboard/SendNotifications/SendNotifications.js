import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useEffect } from "react";
import { NotificationContext } from "../../../../services/Notification/Notification.context";
import { LoadingButton } from "@mui/lab";
import NotificationIcon from "@mui/icons-material/NotificationsActive";
import _ from "lodash";
import { showNotification } from "../../../../shared/Notification/Notification";
const errors = {
  titleRequired: "Title required",
  bodyRequired: "Body required",
  usersRequired: "Users required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  title: {
    ...commonInputFieldProps,
  },
  body: {
    ...commonInputFieldProps,
  },
  users: {
    ...commonInputFieldProps,
    value: [],
  },
};

export const SendNotifications = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const { onSendNotificationToUsers, onGetActiveUsersList } =
    useContext(NotificationContext);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    document.title = title;
    getActiveUsers();
  }, []);

  const getActiveUsers = () => {
    onGetActiveUsersList(
      (result) => {
        console.log(result);
        if (result && result.activeUsersList) {
          let activeUsersList = result.activeUsersList;
          setActiveUsers(activeUsersList);
        }
      },
      () => {
        showNotification({
          message: "An Error occured while fetching the active users list",
          status: "error",
        });
      },
      false,
      false
    );
  };

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

    const { title, body, users } = inputs;

    if (!title.value.trim()) {
      setErrorMessage("title", errors.titleRequired);
    }
    if (!body.value.trim()) {
      setErrorMessage("body", errors.bodyRequired);
    }
    if (!users.value || users.value.length === 0) {
      setErrorMessage("users", errors.usersRequired);
    }

    let data = {
      title: title.value.trim(),
      body: body.value.trim(),
    };
    if (!hadErrors) {
      setLoading(true);
      onSendNotificationToUsers(
        data,
        () => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
        false,
        true
      );
    }
  };

  return (
    <div>
      <Card>
        <CardContent>
          <Typography sx={{ fontSize: 18 }} color="text.primary" gutterBottom>
            {_.upperCase("Send Notifications to users")}
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={onSubmitForm.bind(this)}
            sx={{ mt: 5 }}
          >
            <Grid container spacing={2}>
              <Grid item md={6}>
                <TextField
                  error={inputs.title.error}
                  helperText={inputs.title.errorMessage}
                  margin="normal"
                  required
                  fullWidth
                  id="title"
                  label="Notification Title"
                  name="title"
                  value={inputs.title.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              <Grid item md={6}>
                <TextField
                  error={inputs.body.error}
                  helperText={inputs.body.errorMessage}
                  margin="normal"
                  required
                  fullWidth
                  id="body"
                  label="Notification Body"
                  name="body"
                  value={inputs.body.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>
              <Grid item md={12}>
                <LoadingButton
                  type="submit"
                  fullWidth
                  loadingPosition="end"
                  endIcon={<NotificationIcon />}
                  color="primary"
                  loading={loading}
                  loadingIndicator={"Sending Notifications..."}
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  {!loading && "Send Notifications"}
                </LoadingButton>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};
