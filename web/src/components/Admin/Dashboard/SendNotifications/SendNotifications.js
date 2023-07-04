import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Typography,
  alpha,
} from "@mui/material";
import { useContext, useState } from "react";
import { useEffect } from "react";
import { NotificationContext } from "../../../../services/Notification/Notification.context";
import { LoadingButton } from "@mui/lab";
import NotificationIcon from "@mui/icons-material/NotificationsActive";
import _ from "lodash";
import { showNotification } from "../../../../shared/Notification/Notification";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import * as AnimationData from "../../../../assets/lottie/no_users.json";
import * as NotificationAnimationData from "../../../../assets/lottie/sending_notifications.json";
import { styled } from "styled-components";
import Lottie from "react-lottie";
import { useSpring, animated } from "@react-spring/web";
import moment from "moment";

const errors = {
  titleRequired: "Title required",
  bodyRequired: "Body required",
  usersRequired: "Select Users",
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
};

const LottieContainer = styled.div`
  height: 300px;
  width: 300px;
  padding: 1rem;
  margin: auto;
  margin-top: 4rem;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

const TableProfileContainer = styled.div`
  width: 100px;
  height: 100px;
  &:hover {
    transform: scale(1.2);
    transition: all 1s ease;
  }
`;

const TableProfileImage = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
`;

const NotificationLoaderContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 500px;
  width: 500px;
  text-align: center;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

export const SendNotifications = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const { onSendNotificationToUsers, onGetActiveUsersList } =
    useContext(NotificationContext);

  const [activeUsers, setActiveUsers] = useState([]);
  const [orgActiveUsers, setOrgActiveUsers] = useState([]);

  // for table of users
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [sort, setSort] = useState({
    type: "asc",
    field: null,
  });

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = activeUsers.map((n) => n._id);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selectedUsers.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedUsers, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedUsers.slice(1));
    } else if (selectedIndex === selectedUsers.length - 1) {
      newSelected = newSelected.concat(selectedUsers.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedUsers.slice(0, selectedIndex),
        selectedUsers.slice(selectedIndex + 1)
      );
    }
    setSelectedUsers(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => selectedUsers.indexOf(name) !== -1;

  const onChangeSorting = (fieldToSort) => {
    var currentActiveUsers = activeUsers;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["displayName", "email"];
    if (fields.includes(fieldToSort)) {
      let sortedActiveUsers = _.orderBy(currentActiveUsers, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setActiveUsers(sortedActiveUsers);
    }
  };

  //   table completed

  useEffect(() => {
    document.title = title;
    getActiveUsers();
  }, []);

  const getActiveUsers = () => {
    onGetActiveUsersList(
      (result) => {
        if (result && result.activeUsers) {
          let activeUsersList = _.orderBy(
            result.activeUsers,
            "displayName",
            "asc"
          );
          setActiveUsers(activeUsersList);
          setOrgActiveUsers(activeUsersList);
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

  const onChangeSearchKeyword = (e) => {
    let { target } = e;
    let value = target.value.toLowerCase();
    setActiveUsers(orgActiveUsers);

    setSearchKeyword(target.value);
    if (value.length === 0) {
      setActiveUsers(orgActiveUsers);
      return;
    }
    let filteredData = orgActiveUsers.filter((user) => {
      let m = user;

      let displayNameFound = m.displayName
        ? m.displayName.toLowerCase().includes(value)
        : false;
      let emailFound = m.email ? m.email.toLowerCase().includes(value) : false;
      let phoneNumberFound = m.phoneNumber
        ? m.phoneNumber.toLowerCase().includes(value)
        : false;

      return (
        displayNameFound ||
        emailFound ||
        phoneNumberFound ||
        m.uid.toLowerCase().includes(value)
      );
    });
    setActiveUsers(filteredData);
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

    const { title, body } = inputs;

    if (!title.value.trim()) {
      setErrorMessage("title", errors.titleRequired);
    }
    if (!body.value.trim()) {
      setErrorMessage("body", errors.bodyRequired);
    }
    if (!selectedUsers || selectedUsers.length === 0) {
      hadErrors = true;
      showNotification({
        message: errors.usersRequired,
        status: "error",
      });
    }

    let data = {
      title: title.value.trim(),
      body: body.value.trim(),
      users: selectedUsers,
    };

    if (!hadErrors) {
      setLoading(true);
      onSendNotificationToUsers(
        data,
        () => {
          setLoading(false);
          getActiveUsers();
          setInputs(defaultInputState);
          setSearchKeyword("");
          setSelectedUsers([]);
        },
        () => {
          setLoading(false);
        },
        false,
        true
      );
    }
  };

  const formContainerSprings = useSpring({
    from: { x: 250 },
    to: { x: 0 },
  });

  return loading ? (
    <NotificationLoaderContainer>
      <Box component="h2">Sending Notifications..</Box>
      <Lottie
        isClickToPauseDisabled
        options={{
          loop: true,
          autoplay: true,
          animationData: NotificationAnimationData,
        }}
      />
    </NotificationLoaderContainer>
  ) : (
    <animated.div style={formContainerSprings}>
      <Card>
        <CardContent>
          <Box
            component="form"
            noValidate
            onSubmit={onSubmitForm.bind(this)}
            sx={{ mt: 5 }}
          >
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{ fontSize: 18 }}
                color="text.primary"
                gutterBottom
              >
                {_.upperCase("Send Notifications to active users")}
              </Typography>
              <LoadingButton
                type="submit"
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
            </Box>

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

              <Grid item md={6} sm={12}>
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
                <TextField
                  sx={{ mt: 2, ml: 1, width: "98%" }}
                  variant="standard"
                  size="medium"
                  fullWidth
                  id="search"
                  placeholder="Search by keyword"
                  name="search"
                  value={searchKeyword}
                  onChange={onChangeSearchKeyword}
                />
              </Grid>
              {activeUsers && activeUsers.length > 0 && (
                <Grid item md={12}>
                  <Toolbar
                    sx={{
                      pl: { sm: 2 },
                      pr: { xs: 1, sm: 1 },
                      ...(selectedUsers.length > 0 && {
                        bgcolor: (theme) =>
                          alpha(
                            theme.palette.primary.main,
                            theme.palette.action.activatedOpacity
                          ),
                      }),
                    }}
                  >
                    {selectedUsers.length > 0 ? (
                      <Typography
                        sx={{ flex: "1 1 100%" }}
                        color="inherit"
                        variant="subtitle1"
                        component="div"
                      >
                        {selectedUsers.length} Selected Users
                      </Typography>
                    ) : (
                      <Typography
                        sx={{ flex: "1 1 100%" }}
                        variant="h6"
                        id="tableTitle"
                        component="div"
                      >
                        Select Users
                      </Typography>
                    )}
                  </Toolbar>

                  <TableContainer component={Paper} sx={{ mt: 4 }}>
                    <Table sx={{ minWidth: 750 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              indeterminate={
                                selectedUsers.length > 0 &&
                                selectedUsers.length < activeUsers.length
                              }
                              checked={
                                activeUsers.length > 0 &&
                                selectedUsers.length === activeUsers.length
                              }
                              onChange={handleSelectAllClick}
                              inputProps={{
                                "aria-label": "select all users",
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            {" "}
                            <TableSortLabel
                              direction={
                                sort.type && sort.type === "desc"
                                  ? "asc"
                                  : "desc"
                              }
                              active
                              onClick={() => onChangeSorting("displayName")}
                            >
                              Name
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            {" "}
                            <TableSortLabel
                              direction={
                                sort.type && sort.type === "desc"
                                  ? "asc"
                                  : "desc"
                              }
                              active
                              onClick={() => onChangeSorting("email")}
                            >
                              Email
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Phone Number</TableCell>
                          <TableCell>Image</TableCell>
                          <TableCell>UID & Provider Id</TableCell>
                          <TableCell>Last Login</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(rowsPerPage > 0
                          ? activeUsers.slice(
                              page * rowsPerPage,
                              page * rowsPerPage + rowsPerPage
                            )
                          : activeUsers
                        ).map((user, index) => {
                          const isItemSelected = isSelected(user._id);
                          const labelId = `enhanced-table-checkbox-${index}`;
                          let photoURL = null;
                          if (user.photoURL) {
                            photoURL = user.photoURL.startsWith(
                              `public/users/${user.uid}`
                            )
                              ? `${process.env.REACT_APP_BACKEND_URL}/${user.photoURL}`
                              : user.photoURL;
                          }
                          return (
                            <TableRow
                              onClick={(event) => handleClick(event, user._id)}
                              key={user._id}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                                cursor: "pointer",
                                ":hover": {
                                  background: "var(--primary-rgba)",
                                },
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  color="primary"
                                  checked={isItemSelected}
                                  inputProps={{
                                    "aria-labelledby": labelId,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {user.displayName ? user.displayName : " - "}
                              </TableCell>
                              <TableCell>
                                {user.email ? user.email : " - "}
                              </TableCell>
                              <TableCell>
                                {user.phoneNumber ? user.phoneNumber : "-"}
                              </TableCell>
                              {}
                              <TableCell>
                                {photoURL ? (
                                  <TableProfileContainer
                                    onClick={() => window.open(photoURL)}
                                  >
                                    <TableProfileImage
                                      referrerPolicy="no-referrer"
                                      src={photoURL}
                                      alt="Profile Image"
                                    />
                                  </TableProfileContainer>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {user.uid} <br />{" "}
                                {user.providerId?.toUpperCase()}
                              </TableCell>
                              <TableCell>
                                {user.lastLogin
                                  ? moment(user.lastLogin).format(
                                      "MMM DD YYYY, hh:mm:ss A"
                                    )
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TablePagination
                            rowsPerPageOptions={[
                              20,
                              40,
                              60,
                              { label: "All", value: -1 },
                            ]}
                            count={activeUsers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            SelectProps={{
                              inputProps: {
                                "aria-label": "rows per page",
                              },
                              native: true,
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                          />
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {(!activeUsers || activeUsers.length === 0) && (
                <LottieContainer>
                  <Box component="h3">There are no active users.</Box>
                  <Lottie
                    isClickToPauseDisabled
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: AnimationData,
                    }}
                  />
                </LottieContainer>
              )}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </animated.div>
  );
};
