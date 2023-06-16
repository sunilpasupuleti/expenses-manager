import "./App.css";
import Loader from "./shared/Loader/Loader";
import { Notification } from "./shared/Notification/Notification";
import Layout from "./layout/Layout";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5756d5",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Notification />
      <Loader />
      <Layout />
    </ThemeProvider>
  );
}

export default App;
