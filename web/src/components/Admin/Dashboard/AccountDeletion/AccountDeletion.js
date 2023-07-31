import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useSpring, animated } from "@react-spring/web";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import AcceptIcon from "@mui/icons-material/Check";
import RejectIcon from "@mui/icons-material/ThumbDown";
import CloseIcon from "@mui/icons-material/Close";

import { AccountDeletionContext } from "../../../../services/AccountDeletion/AccountDeletion.context";
import { SocketContext } from "../../../../services/Socket/Socket.context";
import { LoadingButton } from "@mui/lab";
import { hideLoader, showLoader } from "../../../../shared/Loader/Loader";
import navigationTransition from "../../../../shared/NavigationTransition/NavigationTransition";
import NavigationTransition from "../../../../shared/NavigationTransition/NavigationTransition";
import Swal from "sweetalert2";

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

const AccountDeletion = ({ title }) => {
  const { onGetRequests, onDeleteAccount, onRejectRequest } = useContext(
    AccountDeletionContext
  );
  const { onEmitEvent, socket, onFetchEvent } = useContext(SocketContext);

  const isLoading = useSelector((state) => state.loader.isLoading);

  const [requests, setRequests] = useState([]);
  const [orgRequests, setOrgRequests] = useState([]);

  //   for rejections
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialog, setDialog] = useState(false);
  const [loading, setIsLoading] = useState(false);
  let defaultInputState = {
    value: "",
    focused: false,
    error: false,
    errorMessage: "",
  };
  const [rejectedReason, setRejectedReason] = useState(defaultInputState);

  const onValueChangeHandler = (e) => {
    const { value } = e.target;
    setRejectedReason((prevState) => ({
      ...prevState,
      error: false,
      errorMessage: "",
      value,
    }));
  };

  // for table of users
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [sort, setSort] = useState({
    type: "asc",
    field: null,
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const dispatch = useDispatch();

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onChangeSorting = (fieldToSort) => {
    var currentRequests = requests;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["status"];
    if (fields.includes(fieldToSort)) {
      let sortedRequests = _.orderBy(currentRequests, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setRequests(sortedRequests);
    }
  };

  //   table completed

  useEffect(() => {
    document.title = title;
    getRequests();
  }, []);

  const getRequests = () => {
    onGetRequests(
      (result) => {
        if (result && result.requests) {
          let requestsList = result.requests;
          setRequests(requestsList);
          setOrgRequests(requestsList);
        }
      },
      (error) => {
        console.log(error);
        showNotification({
          message: "An Error occured while fetching the requests list",
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
    setRequests(orgRequests);
    setSearchKeyword(target.value);
    if (value.length === 0) {
      setRequests(orgRequests);
      return;
    }
    let filteredData = orgRequests.filter((user) => {
      let m = user;
      let uidFound = m.uid ? m.uid.toLowerCase().includes(value) : false;
      let statusFound = m.status
        ? m.status.toLowerCase().includes(value)
        : false;
      return uidFound || statusFound;
    });
    setRequests(filteredData);
  };

  const containerSprings = useSpring({
    from: { x: 250 },
    to: { x: 0 },
  });

  const onAcceptRequest = (request) => {
    Swal.fire({
      title: "Are you sure you want to delete the account?",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "tomato",
    }).then((result) => {
      if (result.isConfirmed) {
        showLoader(dispatch);
        onDeleteAccount(
          request._id,
          () => {
            onEmitEvent("refreshAccountDeletion");
            hideLoader(dispatch);
            setSearchKeyword("");
          },
          () => {
            hideLoader(dispatch);
          },
          false,
          true
        );
      }
    });
  };

  const onClickRejectRequest = (e) => {
    e.preventDefault();
    let hadErrors = false;
    const setErrorMessage = (name, message) => {
      setRejectedReason((prevState) => ({
        ...prevState,
        error: true,
        errorMessage: message,
      }));
      hadErrors = true;
    };

    if (!rejectedReason.value.trim()) {
      setErrorMessage("title", "Rejection reason required");
    }

    let data = {
      rejectedReason: rejectedReason.value.trim(),
    };
    if (!hadErrors) {
      setIsLoading(true);
      onRejectRequest(
        selectedRequest._id,
        data,
        () => {
          onEmitEvent("refreshAccountDeletion");
          setSearchKeyword("");
          onCloseDialog();
        },
        () => {
          setIsLoading(false);
        },
        false,
        true
      );
    }
  };

  const onCloseDialog = () => {
    setSelectedRequest(null);
    setDialog(false);
    setRejectedReason(defaultInputState);
    setIsLoading(false);
  };

  const onOpenDialog = (request) => {
    setDialog(true);
    setSelectedRequest(request);
  };

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        getRequests();
      };
      onFetchEvent("refreshAccountDeletion", eventHandler);
      return () => {
        socket?.off("refreshAccountDeletion", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

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
                TOTAL REQUESTS - {orgRequests.length}
              </Typography>
            </Box>

            <Grid container spacing={2}>
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
            </Grid>

            {requests && requests.length > 0 && (
              <TableContainer
                component={Paper}
                sx={{
                  mt: 4,
                  maxWidth: "100%",
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
                          onClick={() => onChangeSorting("status")}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Name </TableCell>
                      <TableCell>Deletion Reason </TableCell>
                      <TableCell>Email </TableCell>
                      <TableCell>Phone </TableCell>
                      <TableCell>Profile </TableCell>
                      <TableCell>UID </TableCell>
                      <TableCell>Created At </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(rowsPerPage > 0
                      ? requests.slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                      : requests
                    ).map((request, index) => {
                      let user = request.user
                        ? request.user
                        : request.referenceData;
                      let photoURL = null;
                      if (user && user.photoURL) {
                        photoURL = user.photoURL.startsWith(
                          `public/users/${user?.uid}`
                        )
                          ? `${process.env.REACT_APP_BACKEND_URL}/${user.photoURL}`
                          : user.photoURL;
                      }
                      return (
                        <TableRow
                          key={index}
                          sx={{
                            "&:last-child td, &:last-child th": {
                              border: 0,
                            },
                          }}
                        >
                          <TableCell>
                            <span
                              style={
                                request.status === "deleted"
                                  ? { color: "#198754" }
                                  : request.status === "pending"
                                  ? { color: "#5bc0de" }
                                  : { color: "tomato" }
                              }
                            >
                              <b>{request.status.toUpperCase()}</b>
                              <br /> <br />
                              {request.status === "rejected" &&
                                "REASON : " + request.rejectedReason}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user?.displayName ? user.displayName : "-"}
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell>
                            {user?.email ? user.email : "-"}
                          </TableCell>
                          <TableCell>
                            {user?.phoneNumber ? user.phoneNumber : "-"}
                          </TableCell>
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
                            <strong>{user?.uid}</strong>
                          </TableCell>
                          <TableCell>
                            {moment(request.createdAt).format(
                              "DD MMM YYYY, hh:mm:ss A"
                            )}
                          </TableCell>

                          <TableCell>
                            {request.status === "pending" ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1rem",
                                }}
                              >
                                <Tooltip
                                  onClick={() => onOpenDialog(request)}
                                  className="pointer"
                                  title="Reject"
                                >
                                  <RejectIcon
                                    style={{ cursor: "pointer" }}
                                    fontSize={"medium"}
                                    color="error"
                                  />
                                </Tooltip>

                                <Tooltip
                                  onClick={() => onAcceptRequest(request)}
                                  className="pointer"
                                  title="Accept"
                                >
                                  <AcceptIcon
                                    style={{ cursor: "pointer" }}
                                    fontSize={"medium"}
                                    color="success"
                                  />
                                </Tooltip>
                              </div>
                            ) : (
                              "-"
                            )}
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
                        count={requests.length}
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

            {(!requests || requests.length === 0) && (
              <LottieContainer>
                <Box component="h3">There are no requests.</Box>
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

      {selectedRequest && (
        <Dialog fullWidth onClose={onCloseDialog} open={dialog}>
          <Box
            component="form"
            noValidate
            onSubmit={onClickRejectRequest.bind(this)}
          >
            <DialogTitle>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>Reject Request</div>
              </div>
            </DialogTitle>
            <DialogContent>
              <TextField
                error={rejectedReason.error}
                helperText={rejectedReason.errorMessage}
                margin="normal"
                required
                fullWidth
                id="rejectedReason"
                label="Reason"
                name="title"
                placeholder="Enter the reason for rejecting the request"
                value={rejectedReason.value}
                onChange={onValueChangeHandler}
              />
            </DialogContent>

            <DialogActions>
              <Button
                type="button"
                onClick={onCloseDialog}
                endIcon={<CloseIcon />}
                color="inherit"
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Cancel
              </Button>

              <LoadingButton
                type="submit"
                loadingPosition="end"
                endIcon={<RejectIcon />}
                color="error"
                loading={loading}
                loadingIndicator={"Rejecting..."}
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                {!loading && "Reject Request"}
              </LoadingButton>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </NavigationTransition>
  );
};

export default AccountDeletion;
