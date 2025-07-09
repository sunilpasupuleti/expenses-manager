import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useEffect } from "react";
import _ from "lodash";
import { showNotification } from "../../../../shared/Notification/Notification";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import * as AnimationData from "../../../../assets/lottie/no_users.json";
import { styled } from "styled-components";
import Lottie from "react-lottie";
import { UserContext } from "../../../../services/User/User.context";
import moment from "moment";
import { useSelector } from "react-redux";
import ViewIcon from "@mui/icons-material/RemoveRedEye";
import NavigationTransition from "../../../../shared/NavigationTransition/NavigationTransition";
import { getFirebaseAccessUrl } from "../../../../utility/helper";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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

const DialogProfileContainer = styled.div`
  width: 60px;
  height: 60px;
  &:hover {
    transform: scale(1.2);
    transition: all 1s ease;
  }
`;

const DialogProfileImage = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 50px;
  cursor: pointer;
`;

const Users = ({ title }) => {
  const { onGetUsers } = useContext(UserContext);
  const isLoading = useSelector((state) => state.loader.isLoading);

  const [users, setUsers] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const { version } = useParams();
  const navigate = useNavigate();
  // for table of users
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [dialog, setDialog] = useState(false);

  const [sort, setSort] = useState({
    type: "asc",
    field: null,
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onChangeSorting = (fieldToSort) => {
    var currentUsers = users;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["displayName", "email"];
    if (fields.includes(fieldToSort)) {
      let sortedUsers = _.orderBy(currentUsers, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setUsers(sortedUsers);
    }
  };

  useEffect(() => {
    if (version) {
      document.title = title + " - " + version;
      getUsers();
    }
  }, [version]);

  //   table completed

  useEffect(() => {}, []);

  const getUsers = () => {
    onGetUsers(
      version,
      (result) => {
        if (result && result.users) {
          let usersList = result.users;
          // let usersList = _.orderBy(result.users, "displayName", "asc");
          console.log(usersList);

          setUsers(usersList);
          setOrgUsers(usersList);
        }
      },
      (error) => {
        console.log(error);
        showNotification({
          message:
            error.message ||
            "An Error occured while fetching the  users list " +
              error.toString(),
          status: "error",
        });
      },
      true,
      false
    );
  };

  const onChangeSearchKeyword = (e) => {
    let { target } = e;
    let value = target.value.toLowerCase();
    setUsers(orgUsers);

    setSearchKeyword(target.value);
    if (value.length === 0) {
      setUsers(orgUsers);
      return;
    }
    let filteredData = orgUsers.filter((user) => {
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
    setUsers(filteredData);
  };

  const onCloseDialog = () => {
    setSelectedUser(null);
    setDialog(false);
  };

  const onSelectUser = (user) => {
    let data = {
      ...user,
    };
    let photoURL = null;
    if (user.photoURL) {
      photoURL = user.photoURL.startsWith(`users/${user?.uid}`)
        ? getFirebaseAccessUrl(user.photoURL)
        : user.photoURL;
    }
    data.photoURL = photoURL;
    setSelectedUser(user);
    setDialog(true);
  };

  const returnSelectedUserValue = (key) => {
    if (selectedUser && selectedUser[key]) {
      return selectedUser[key];
    } else {
      return "-";
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

  const handleVersionChange = async (event) => {
    const value = event.target.value;
    navigate(`/dashboard/users/${value}`);
  };

  return isLoading ? null : (
    <NavigationTransition>
      <Card>
        <CardContent>
          <Box>
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{ fontSize: 18, fontWeight: "bold" }}
                color="text.primary"
                gutterBottom
              >
                TOTAL USERS - {orgUsers.length}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item md={8}>
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
              <Grid item md={4}>
                <FormControl fullWidth>
                  <InputLabel id="version">Age</InputLabel>
                  <Select
                    labelId="version-label"
                    id="version"
                    value={version}
                    label="Version"
                    onChange={handleVersionChange}
                  >
                    <MenuItem value={"new-version"}>New Version</MenuItem>
                    <MenuItem value={"old-version"}>Old Version</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {users && users.length > 0 && (
              <TableContainer
                component={Paper}
                sx={{
                  mt: 4,
                  maxWidth: "100%",
                  //   maxWidth: "max-content",
                }}
              >
                <Table style={{ tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        {" "}
                        <TableSortLabel
                          direction={
                            sort.type && sort.type === "desc" ? "asc" : "desc"
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
                            sort.type && sort.type === "desc" ? "asc" : "desc"
                          }
                          active
                          onClick={() => onChangeSorting("email")}
                        >
                          Email
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Profile</TableCell>
                      <TableCell>UID & Provider Id</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(rowsPerPage > 0
                      ? users.slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                      : users
                    ).map((user, index) => {
                      let photoURL = null;
                      if (user.photoURL) {
                        photoURL = user.photoURL.startsWith(
                          `users/${user?.uid}`
                        )
                          ? getFirebaseAccessUrl(user.photoURL)
                          : user.photoURL;
                      }
                      return (
                        <TableRow
                          key={index}
                          sx={{
                            "&:last-child td, &:last-child th": {
                              border: 0,
                            },
                            ":hover": {
                              background: "var(--primary-rgba)",
                            },
                          }}
                        >
                          <TableCell>
                            {user.displayName ? user.displayName : "-"}
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              onClick={() =>
                                copyContentToClipboard(
                                  user.email ? user.email : "-"
                                )
                              }
                              className="pointer"
                              title="copy to clipboard"
                            >
                              <span>{user.email ? user.email : "-"}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {user.brand ? user.brand.toUpperCase() : ""} (
                            {user.platform ? user.platform.toUpperCase() : "-"}
                            )
                            <br />
                            {user.model ? " -" + user.model.toUpperCase() : ""}
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
                              onClick={() => copyContentToClipboard(user.uid)}
                              className="pointer"
                              title="copy to clipboard"
                            >
                              <strong>{user.uid}</strong>
                            </Tooltip>
                            <br />
                            <br />
                            {user.providerId?.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div onClick={() => onSelectUser(user)}>
                              <ViewIcon
                                style={{ cursor: "pointer" }}
                                fontSize={"medium"}
                                color="primary"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[
                          40,
                          80,
                          120,
                          { label: "All", value: -1 },
                        ]}
                        count={users.length}
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
            )}

            {(!users || users.length === 0) && (
              <LottieContainer>
                <Box component="h3">There are no users.</Box>
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
          </Box>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog fullWidth onClose={onCloseDialog} open={dialog}>
          <DialogTitle>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>User Data</div>
              {selectedUser.photoURL && (
                <DialogProfileContainer
                  onClick={() => window.open(selectedUser.photoURL)}
                >
                  <DialogProfileImage
                    referrerPolicy="no-referrer"
                    src={selectedUser.photoURL}
                    alt="Profile Image"
                  />
                </DialogProfileContainer>
              )}
            </div>
          </DialogTitle>
          <DialogContent>
            <TableContainer component={Paper}>
              <Table style={{ tableLayout: "auto" }}>
                <TableBody>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("displayName")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Uid</TableCell>
                    <TableCell>
                      <Tooltip
                        onClick={() =>
                          copyContentToClipboard(returnSelectedUserValue("uid"))
                        }
                        className="pointer"
                        title="copy"
                      >
                        <strong>{returnSelectedUserValue("uid")}</strong>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>
                      <Tooltip
                        onClick={() =>
                          copyContentToClipboard(
                            returnSelectedUserValue("email")
                          )
                        }
                        className="pointer"
                        title="copy"
                      >
                        <span>{returnSelectedUserValue("email")}</span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Phone</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("phoneNumber")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("platform").toUpperCase()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("providerId").toUpperCase()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Backups</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("backups").length || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TimeZone</TableCell>
                    <TableCell>
                      <b>{returnSelectedUserValue("timeZone")}</b>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Daily Backup</TableCell>
                    <TableCell>
                      {returnSelectedUserValue("dailyBackup")
                        ? "ENABLED"
                        : "DISABLED"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Daily Reminder</TableCell>
                    <TableCell>
                      {selectedUser.dailyReminder &&
                      selectedUser.dailyReminder.enabled
                        ? `Enabled at ${selectedUser.dailyReminder.time} `
                        : "DISABLED"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Login</TableCell>
                    <TableCell>
                      {selectedUser.lastLogin
                        ? moment(selectedUser.lastLogin).format(
                            "DD MMM YYYY, hh:mm:ss A"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Synced</TableCell>
                    <TableCell>
                      {selectedUser.lastSynced
                        ? moment(selectedUser.lastSynced).format(
                            "DD MMM YYYY, hh:mm:ss A"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                  {version === "old-version" && (
                    <>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>
                          {selectedUser.createdAt
                            ? moment(selectedUser.createdAt).format(
                                "DD MMM YYYY, hh:mm:ss A"
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Updated At</TableCell>
                        <TableCell>
                          {selectedUser.updatedAt
                            ? moment(selectedUser.updatedAt).format(
                                "DD MMM YYYY, hh:mm:ss A"
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
      )}
    </NavigationTransition>
  );
};

export default Users;
