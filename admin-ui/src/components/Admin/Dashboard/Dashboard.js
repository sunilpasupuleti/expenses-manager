import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import NotificationIcon from "@mui/icons-material/Notifications";
import SignOutIcon from "@mui/icons-material/ExitToApp";
import { useEffect } from "react";
import { useContext } from "react";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { styled as scStyled } from "styled-components";
import { Avatar, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState } from "react";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const HeaderLogo = scStyled.img`
  height : 30px;
  width : 30px;
  border-radius : 50px;
  margin-right : 0.5rem;
`;

export const Dashboard = ({ title }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { onLogout, userData } = useContext(AuthenticationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    document.title = title;
  }, []);

  const ListItemStyles = (paths = []) => {
    let obj = {
      display: "block",
    };
    if (paths.includes(location.pathname)) {
      obj.backgroundColor = "var(--primary)";
      obj.color = "#fff";
    }

    return obj;
  };
  const ListItemButtonStyles = {
    minHeight: 48,
    justifyContent: open ? "initial" : "center",
    px: 2.5,
  };

  const ListItemIconStyles = (paths = []) => {
    let obj = {
      minWidth: 0,
      mr: open ? 3 : "auto",
      justifyContent: "center",
    };
    if (paths.includes(location.pathname)) {
      obj.color = "#fff";
    }

    return obj;
  };

  const onClickLogout = () => {
    onLogout(() => {
      navigate("/admin");
    });
  };

  const pathNames = {
    notification: "/dashboard/send-notifications",
  };

  return userData ? (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 2,
              ...(open && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <HeaderLogo src={require("../../../assets/icon.jpeg")} />
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 600,
              color: "inherit",
            }}
          >
            Expenses Manager
          </Typography>

          <Box sx={{ flexGrow: 1 }}></Box>
          <Box sx={{ flexGrow: 0 }}>
            {window.innerWidth > 768 && userData?.name}
            <Tooltip title={userData?.name} className="ml-0-5">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={userData?.name}
                  src="/static/images/avatar/2.jpg"
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={onClickLogout}>
                <Typography textAlign="center">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem
            disablePadding
            sx={ListItemStyles([pathNames.notification])}
            onClick={() => navigate(pathNames.notification)}
          >
            <ListItemButton sx={ListItemButtonStyles}>
              <ListItemIcon sx={ListItemIconStyles([pathNames.notification])}>
                <NotificationIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Send Notifications"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem
            disablePadding
            sx={ListItemStyles()}
            onClick={onClickLogout}
          >
            <ListItemButton sx={ListItemButtonStyles}>
              <ListItemIcon sx={ListItemIconStyles()}>
                <SignOutIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Sign Out"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  ) : null;
};
