import {
  Avatar,
  Box,
  Button,
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
  Tooltip,
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
import moment from "moment";
import { SocketContext } from "../../../../services/Socket/Socket.context";
import NavigationTransition from "../../../../shared/NavigationTransition/NavigationTransition";
import { useSelector } from "react-redux";

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
    value: "🤗Please update the APP🤗",
  },
  body: {
    ...commonInputFieldProps,
    value: "Latest version is now available, Thank you WEBWIZARD(SUNIL).",
  },
  bigPicture: {
    ...commonInputFieldProps,
  },
  largeIcon: {
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
  border-radius: 50px;
  cursor: pointer;
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

const SendNotifications = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);

  const isLoading = useSelector((state) => state.loader.isLoading);

  const { onSendDailyUpdateNotificationToUsers, onGetActiveDevicesList } =
    useContext(NotificationContext);

  const [activeDevices, setActiveDevices] = useState([]);
  const [orgActiveDevices, setOrgActiveDevices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const { onEmitEvent, socket, onFetchEvent } = useContext(SocketContext);

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
      const newSelected = activeDevices.map((n) => n.playerId);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  const handleClick = (event, playerId) => {
    let currentSelectedUsers = [...selectedUsers];
    const alreadySelected = currentSelectedUsers.find((id) => id === playerId);

    if (alreadySelected) {
      currentSelectedUsers = selectedUsers.filter((id) => id !== playerId);
    } else {
      activeDevices.filter((a) => {
        if (a.playerId === playerId) {
          currentSelectedUsers.push(playerId);
        }
      });
    }
    setSelectedUsers(currentSelectedUsers);
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
    var currentActiveUsers = activeDevices;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["displayName", "email"];
    if (fields.includes(fieldToSort)) {
      let sortedActiveUsers = _.orderBy(currentActiveUsers, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setActiveDevices(sortedActiveUsers);
    }
  };

  //   table completed

  useEffect(() => {
    document.title = title;
    getActiveDevices();
  }, []);

  const getActiveDevices = () => {
    onGetActiveDevicesList(
      (result) => {
        if (result && result.activeDevices) {
          setAllUsers(result.users);
          let actDevices = result.activeDevices;
          let structuredDevicesList = [];

          actDevices.forEach((a) => {
            let tags = a.tags;
            if (a.id) {
              let obj = {
                device: {
                  os: a.device_os,
                  model: a.device_model,
                },
                playerId: a.id,
                lastActive: moment
                  .unix(a.last_active)
                  .format("DD MMM YYYY, hh:mm:ss A"),
              };
              if (tags && tags.uid) {
                let user = result.users.find((u) => u.uid === tags.uid);
                obj.displayName = user?.displayName;
                obj.email = user?.email;
                obj.phoneNumber = user?.phoneNumber;
                obj.photoURL = user?.photoURL;
                obj.providerId = user?.providerId;
                obj.uid = user?.uid;
                obj._id = user?._id;
                obj.platform = user?.platform;
              }
              structuredDevicesList.push(obj);
            }
          });
          let activeDevicesList = _.orderBy(
            structuredDevicesList,
            "lastActive",
            "desc"
          );
          setActiveDevices(activeDevicesList);
          setOrgActiveDevices(activeDevicesList);
        }
      },
      () => {
        showNotification({
          message: "An Error occured while fetching the active users list",
          status: "error",
        });
      },
      true,
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
    setActiveDevices(orgActiveDevices);

    setSearchKeyword(target.value);
    if (value.length === 0) {
      setActiveDevices(orgActiveDevices);
      return;
    }
    let filteredData = orgActiveDevices.filter((user) => {
      let m = user;

      let displayNameFound = m.displayName
        ? m.displayName.toLowerCase().includes(value)
        : false;
      let emailFound = m.email ? m.email.toLowerCase().includes(value) : false;
      let phoneNumberFound = m.phoneNumber
        ? m.phoneNumber.toLowerCase().includes(value)
        : false;
      let uidFound = m.uid ? m.uid.toLowerCase().includes(value) : false;
      let providerIdFound = m.providerId
        ? m.providerId.toLowerCase().includes(value)
        : false;
      let platformFound = m.platform
        ? m.platform.toLowerCase().includes(value)
        : false;

      return (
        displayNameFound ||
        emailFound ||
        phoneNumberFound ||
        uidFound ||
        providerIdFound ||
        platformFound
      );
    });
    setActiveDevices(filteredData);
  };

  const getBase64 = async (file) => {
    return new Promise((resolve) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
        resolve(reader.result);
      };
    });
  };

  const onSubmitForm = async (e) => {
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

    const { title, body, bigPicture, largeIcon } = inputs;

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

    let finalSelectedUsers = Array.from(new Set(selectedUsers));

    let data = {
      title: title.value.trim(),
      body: body.value.trim(),
      users: finalSelectedUsers,
    };

    if (bigPicture.value) {
      data.bigPicture = await getBase64(bigPicture.value);
    }
    if (largeIcon.value) {
      data.largeIcon = await getBase64(largeIcon.value);
    }

    if (!hadErrors) {
      setLoading(true);
      onSendDailyUpdateNotificationToUsers(
        data,
        () => {
          onEmitEvent("refreshSendNotifications");
          setLoading(false);
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

  const copyContentToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification({
        message: "Text Copied",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        getActiveDevices();
      };
      onFetchEvent("refreshSendNotifications", eventHandler);
      return () => {
        socket?.off("refreshSendNotifications", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

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
  ) : isLoading ? null : (
    <NavigationTransition>
      {activeDevices && activeDevices.length > 0 && (
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

                <Grid item md={6} sm={12}>
                  {/* big picture */}
                  <Grid container spacing={2} alignItems={"center"}>
                    <Grid item md={6} sm={12}>
                      <Button fullWidth variant="outlined" component="label">
                        {inputs.bigPicture.value
                          ? " Change Big Picture"
                          : "Select Big Picture"}
                        <input
                          type="file"
                          hidden
                          accept="image/png, image/jpg, image/jpeg"
                          onChange={(e) => {
                            setInputs((p) => ({
                              ...p,
                              bigPicture: {
                                ...p.bigPicture,
                                value: e.target.files[0],
                              },
                            }));
                          }}
                        />
                      </Button>
                      {inputs.bigPicture.value && (
                        <Button
                          fullWidth
                          variant="contained"
                          style={{
                            backgroundColor: "tomato",
                            color: "#fff",
                            marginTop: 10,
                          }}
                          onClick={() =>
                            setInputs((p) => ({
                              ...p,
                              bigPicture: { ...p.bigPicture, value: "" },
                            }))
                          }
                        >
                          Remove Big Picture
                        </Button>
                      )}
                    </Grid>
                    <Grid item md={6} sm={12}>
                      {inputs.bigPicture.value && (
                        <Avatar
                          src={URL.createObjectURL(inputs.bigPicture.value)}
                          sx={{ width: 200, height: 200 }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item md={6} sm={12}>
                  {/* large icon */}
                  <Grid container spacing={2} alignItems={"center"}>
                    <Grid item md={6} sm={12}>
                      <Button fullWidth variant="outlined" component="label">
                        {inputs.largeIcon.value
                          ? " Change Large Icon"
                          : "Select Large Icon"}
                        <input
                          type="file"
                          hidden
                          accept="image/png, image/jpg, image/jpeg"
                          onChange={(e) => {
                            setInputs((p) => ({
                              ...p,
                              largeIcon: {
                                ...p.largeIcon,
                                value: e.target.files[0],
                              },
                            }));
                          }}
                        />
                      </Button>
                      {inputs.largeIcon.value && (
                        <Button
                          fullWidth
                          variant="contained"
                          style={{
                            backgroundColor: "tomato",
                            color: "#fff",
                            marginTop: 10,
                          }}
                          onClick={() =>
                            setInputs((p) => ({
                              ...p,
                              largeIcon: { ...p.largeIcon, value: "" },
                            }))
                          }
                        >
                          Remove Large Icon
                        </Button>
                      )}
                    </Grid>
                    <Grid item md={6} sm={12}>
                      {inputs.largeIcon.value && (
                        <Avatar
                          src={URL.createObjectURL(inputs.largeIcon.value)}
                          sx={{ width: 200, height: 200 }}
                        />
                      )}
                    </Grid>
                  </Grid>
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
                {activeDevices && activeDevices.length > 0 && (
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
                                  selectedUsers.length < activeDevices.length
                                }
                                checked={
                                  activeDevices.length > 0 &&
                                  selectedUsers.length === activeDevices.length
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
                            <TableCell>Device</TableCell>
                            <TableCell>Phone </TableCell>
                            <TableCell>Image</TableCell>
                            <TableCell>UID or Player ID </TableCell>
                            <TableCell>Last Active</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(rowsPerPage > 0
                            ? activeDevices.slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                              )
                            : activeDevices
                          ).map((user, index) => {
                            const isItemSelected = isSelected(user.playerId);
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
                                onClick={(event) => {
                                  handleClick(event, user.playerId);
                                }}
                                key={index}
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
                                  Model : {user.device.model} <br />
                                  Os : {user.device.os}
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
                                  <Tooltip
                                    onClick={() =>
                                      copyContentToClipboard(
                                        user.uid ? user.uid : user.playerId
                                      )
                                    }
                                    className="pointer"
                                    title="copy"
                                  >
                                    <strong>
                                      {user.uid ? user.uid : user.playerId}
                                    </strong>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  {user.lastActive ? user.lastActive : "-"}
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
                              count={activeDevices.length}
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
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {(!activeDevices || activeDevices.length === 0) && (
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
    </NavigationTransition>
  );
};

export default SendNotifications;
