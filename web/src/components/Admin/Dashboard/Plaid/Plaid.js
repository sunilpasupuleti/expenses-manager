// ⬇️ TOP: Imports (unchanged)
import { useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Pagination,
  Button,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import moment from "moment";
import _ from "lodash";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./Plaid.module.css";
import { PlaidContext } from "../../../../services/Plaid/Plaid.context";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { showNotification } from "../../../../shared/Notification/Notification";
import { SocketContext } from "../../../../services/Socket/Socket.context";

const ACTION_COLORS = {
  account_balance: "#6C5CE7",
  transactions: "#00B894",
  link_account: "#1E88E5",
  unlink_account: "tomato",
};

const apiSettings = [
  { key: "enabled", label: "Enable Plaid (Global)", type: "switch" },
  { key: "accounts", label: "Accounts API", type: "switch" },
  { key: "link_account", label: "Link Account", type: "switch" },
  { key: "unlink_account", label: "Unlink Account", type: "switch" },
  { key: "account_balance", label: "Account Balance API", type: "switch" },
  { key: "transactions", label: "Transactions API", type: "switch" },
  {
    key: "max_linked_institutions",
    label: "Max Linked Institutions",
    type: "number",
  },
];

const apiSummary = [
  { api: "account_balance", name: "Account Balance API Calls" },
  { api: "transactions", name: "Transactions API Calls" },
  { api: "link_account", name: "Total Linked Accounts" },
  { api: "unlink_account", name: "Total Unlinked Accounts" },
];

const Plaid = ({ title }) => {
  const { onGetPlaidData, onUpdatePlaidSettings, onUpdatePlaidUrls } =
    useContext(PlaidContext);
  const { onEmitEvent, socket, onFetchEvent } = useContext(SocketContext);
  const [settings, setSettings] = useState({});
  const [plaidData, setPlaidData] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 7;

  useEffect(() => {
    document.title = title;
    getPlaidData(fromDate, toDate); // initial load
  }, []);

  useEffect(() => {
    if (socket) {
      const eventHandler = () => {
        getPlaidData(fromDate, toDate);
      };
      onFetchEvent("refreshPlaidDashboardData", eventHandler);
      return () => {
        socket?.off("refreshPlaidDashboardData", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  const getPlaidData = async (fromDt, toDt) => {
    const payload = {
      fromDate: fromDt ? dayjs(fromDt).format("YYYY-MM-DD") : null,
      toDate: toDt ? dayjs(toDt).format("YYYY-MM-DD") : null,
    };

    onGetPlaidData(
      payload,
      (res) => {
        setPlaidData(res.data);

        setSettings(res.data.settings);
      },
      () => {},
      true,
      false
    );
  };

  const updatePlaidSettings = async () => {
    const data = {
      settings: settings,
    };
    onUpdatePlaidSettings(
      data,
      (res) => {
        onEmitEvent("refreshPlaidDashboardData");
      },
      () => {},
      true,
      true
    );
  };

  const updatePlaidUrls = async () => {
    const data = {
      webhookUrl: settings.webhook_url,
      OAuthRedirectionUrl: settings.oauth_redirect_url,
    };

    onUpdatePlaidUrls(
      data,
      (res) => {
        onEmitEvent("refreshPlaidDashboardData");
      },
      () => {},
      true,
      true
    );
  };

  const applyFilter = () => {
    if (!fromDate || !toDate) {
      showNotification({ message: "Please select both From and To dates" });
      return;
    }
    getPlaidData(fromDate, toDate);
  };

  const resetFilter = () => {
    setFromDate(null);
    setToDate(null);
    getPlaidData(null, null);
  };

  const summary = plaidData?.summary || {};
  const chartData = plaidData?.chartData || [];
  const logsGroupedByDate = plaidData?.logsGrouped || [];

  const paginatedLogs = logsGroupedByDate.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  return plaidData ? (
    <Box p={3}>
      {/* Settings UI */}
      <Box mt={4}>
        <Card variant="outlined" sx={{ backgroundColor: "#f8f9fc" }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              🔧 Plaid API Feature Control
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Toggle specific APIs or disable Plaid globally.
            </Typography>

            <Grid container spacing={2} mt={1}>
              {apiSettings.map(({ key, label, type }) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  {type === "switch" ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!settings[key]}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          color="primary"
                          disabled={!settings.enabled && key !== "enabled"}
                        />
                      }
                      label={label}
                    />
                  ) : type === "number" ? (
                    <TextField
                      type="number"
                      label={label}
                      variant="outlined"
                      fullWidth
                      value={settings[key] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSettings((prev) => ({
                          ...prev,
                          [key]: value,
                        }));
                      }}
                      inputProps={{
                        min: 1,
                      }}
                      disabled={!settings.enabled}
                    />
                  ) : null}
                </Grid>
              ))}
            </Grid>

            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="success"
                onClick={updatePlaidSettings}
              >
                Save Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Update Plaid URL Section */}
      <Box mt={5}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          🔄 Update Webhook URL & OAuth Redirection URL
        </Typography>

        <Grid container spacing={2} mt={1} alignItems="center">
          <Grid item xs={12} sm={12}>
            <TextField
              label="New Webhook URL (BACKEND)"
              placeholder="https://example.com/bank-account/publicTokenWebhook"
              variant="outlined"
              value={settings.webhook_url || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  webhook_url: e.target.value,
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <TextField
              style={{}}
              label="New OAuth Redirection URL (UI)"
              placeholder="https://example.com/plaid-oauth-redirect.html"
              variant="outlined"
              value={settings.oauth_redirect_url || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  oauth_redirect_url: e.target.value,
                }))
              }
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                color="info"
                sx={{
                  height: "56px",
                }}
                onClick={updatePlaidUrls}
              >
                Update URL'S
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {/* Filter Header */}
      <Box my={4}>
        <Divider />

        <Box
          display="flex"
          my={4}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight={600}>
            Plaid API Analytics
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" gap={2}>
              <DatePicker
                label="From"
                value={fromDate}
                onChange={setFromDate}
                format="YYYY-MM-DD"
              />
              <DatePicker
                label="To"
                value={toDate}
                onChange={setToDate}
                format="YYYY-MM-DD"
              />
              <Button variant="contained" color="primary" onClick={applyFilter}>
                Apply Filter
              </Button>
              <Button variant="outlined" onClick={resetFilter}>
                Reset
              </Button>
            </Box>
          </LocalizationProvider>
        </Box>
      </Box>

      {/* Summary Cards Layout */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={4}>
          <Card className={styles.totalApiCard}>
            <CardContent>
              <Typography className={styles.totalApiTitle}>
                Total API Calls [Balance + Transactions]
              </Typography>
              <Typography className={styles.totalApiCount}>
                {summary.totalBalanceAndTransactionsAPICalls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {apiSummary.map(({ api, name }) => (
              <Grid item xs={12} sm={6} key={api}>
                <Card
                  sx={{ backgroundColor: ACTION_COLORS[api], color: "#fff" }}
                >
                  <CardContent>
                    <Typography variant="subtitle2">{name}</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {summary[api] || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/*Chart */}
      <Box my={4}>
        <Divider />
        <Typography variant="h6" fontWeight={600} gutterBottom mt={3}>
          API Usage Trends (Last 7 Days)
        </Typography>
        <Card elevation={2}>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 40, left: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => moment(date).format("MMM D")}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(date) =>
                    moment(date).format("dddd, MMMM D, YYYY")
                  }
                />
                <Legend />
                {_.uniq(
                  _.flatMap(chartData, (d) =>
                    _.keys(d).filter((k) => k !== "date")
                  )
                ).map((action) => (
                  <Bar
                    key={action}
                    dataKey={action}
                    fill={ACTION_COLORS[action] || "#ccc"}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* 🧾 Logs */}
      <Box my={4}>
        <Divider />
        <Typography variant="h6" fontWeight={600} gutterBottom mt={3}>
          Daily API Activity
        </Typography>
        <Box>
          {paginatedLogs.map((log) => (
            <Accordion key={log.date}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={500}>
                  {moment(log.date).format("dddd, MMMM D, YYYY")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {log.actions.map((entry, idx) => (
                    <Chip
                      key={idx}
                      label={`${_.startCase(entry.action)}: ${entry.count}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(logsGroupedByDate.length / logsPerPage)}
              page={currentPage}
              onChange={(_, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  ) : null;
};

export default Plaid;
