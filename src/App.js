import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import DancePreference from './components/DancePreference/DancePreference';
import { Typography, Button, Container, Card, CardContent, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import TypingText from './components/TypingText/TypingText';
import 'animate.css';
import { motion } from 'framer-motion';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [spreadsheetName, setSpreadsheetName] = useState(null);
  const [token, setToken] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(null);
  const [sheetName, setSheetName] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [dances, setDances] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const resultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#1E90FF', // New accent color
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#ffffff',
      },
    },
    typography: {
      fontFamily: 'Poppins, sans-serif',
    },
  });

  // Load Google API client and Picker API
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
    const savedSpreadsheetName = localStorage.getItem('spreadsheetName');

    const loadApis = () => {
      let apisLoadedCount = 0;

      const onApiLoad = () => {
        apisLoadedCount++;
        if (apisLoadedCount === 2) {
          // Both APIs loaded
          initializeGapiClient();
        }
      };

      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = onApiLoad;
      document.body.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://apis.google.com/js/picker.js';
      script2.onload = onApiLoad;
      document.body.appendChild(script2);
    };

    const initializeGapiClient = async () => {
      window.gapi.load('client', async () => {
        console.log('GAPI client loaded for API');
        await window.gapi.client.load('drive', 'v3');
        await window.gapi.client.load('sheets', 'v4');

        if (savedToken) {
          setToken(savedToken);
          window.gapi.client.setToken({ access_token: savedToken });
        } else {
          setToken(null);
        }

        if (savedUser) {
          setUser(savedUser);
        }

        if (savedSpreadsheetId && savedSpreadsheetName) {
          setSpreadsheetId(savedSpreadsheetId);
          setSpreadsheetName(savedSpreadsheetName);
          loadSheetNames(savedSpreadsheetId);
        }

        setIsInitialized(true);
      });
    };

    loadApis();
  }, []);

  useEffect(() => {
    if (spreadsheetId && sheetName) {
      processSheet();
    }
  }, [spreadsheetId, sheetName]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      setToken(tokenResponse.access_token);
      localStorage.setItem('token', tokenResponse.access_token);
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });

      // Fetch user info
      try {
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        console.log('User Info:', userInfoResponse.data);
        setUser(userInfoResponse.data);
        localStorage.setItem('user', JSON.stringify(userInfoResponse.data));
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUser(null);
      }
    },
    scope: SCOPES,
    flow: 'implicit',
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    setSpreadsheetId(null);
    setSpreadsheetName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('spreadsheetId');
    localStorage.removeItem('spreadsheetName');
  };

  const handleSheetSelection = () => {
    if (!token) {
      console.error('OAuth token is missing or invalid.');
      return;
    }
    // Reset sheet name and dances when selecting a different spreadsheet
    setSheetName(null);
    setDances([]);
    setPreferences({
      fixedPositions: [],
      Start: [],
      Middle: [],
      End: [],
    });
    createPicker();
  };

  const createPicker = () => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
      .setMimeTypes('application/vnd.google-apps.spreadsheet');

    try {
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .setOrigin(window.location.protocol + '//' + window.location.host)
        .build();
      picker.setVisible(true);
    } catch (error) {
      console.error('Failed to create Picker:', error);
      if (error.message && (error.message.includes('401') || error.message.includes('invalid'))) {
        alert('Authorization error: Please log in again.');
        logout();
      }
    }
  };

  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      setSpreadsheetId(doc.id);
      setSpreadsheetName(doc.name);
      localStorage.setItem('spreadsheetId', doc.id);
      localStorage.setItem('spreadsheetName', doc.name);
      loadSheetNames(doc.id);
    }
  };

  const loadSheetNames = async (id) => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: id,
      });
      const sheetTitles = response.result.sheets.map((sheet) => sheet.properties.title);
      setSheets(sheetTitles);
    } catch (error) {
      console.error('Error loading sheet names:', error);
      if (error.status === 401 || error.status === 403) {
        logout();
      }
    }
  };

  const processSheet = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        'https://us-central1-dancesorterbackend.cloudfunctions.net/get_dances',
        {
          token: token,
          spreadsheetId: spreadsheetId,
          sheetName: sheetName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setDances(response.data.dances);
    } catch (error) {
      console.error('Error fetching dances', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
    }
    setIsProcessing(false);
  };

  const [preferences, setPreferences] = useState({
    fixedPositions: [],
    Start: [],
    Middle: [],
    End: [],
  });

  const submitPreferences = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        'https://us-central1-dancesorterbackend.cloudfunctions.net/process_request',
        {
          token: token,
          spreadsheetId: spreadsheetId,
          sheetName: sheetName,
          preferences: preferences,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setResults(response.data.results);
    } catch (error) {
      console.error('Error processing preferences', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert('Session expired. Please log in again.');
        logout();
      }
    }
    setIsProcessing(false);
  };

  if (!isInitialized) {
    return null; // Or a loading indicator
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        {token ? (
          <>
            {/* User Info and Logout Button */}
            <div className="user-info">
              {user ? (
                <>
                  <Typography variant="body1" style={{ marginRight: '16px' }}>
                    Logged in as: {user.email}
                  </Typography>
                  <Button color="primary" variant="outlined" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="contained" color="primary" onClick={() => login()}>
                  Sign in with Google
                </Button>
              )}
            </div>

            {/* Spreadsheet Info and Select Different Spreadsheet Button */}
            {spreadsheetId && (
              <div className="spreadsheet-info">
                <Typography variant="body1">Spreadsheet: {spreadsheetName}</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSheetSelection}
                  className="select-different-button"
                >
                  Select a Different Spreadsheet
                </Button>
              </div>
            )}

            {/* Main App Content */}
            {!spreadsheetId ? (
              // Prompt to select a Google Sheet
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                transition={{ duration: 0.5 }}
                className="select-sheet-container"
              >
                <Button variant="contained" color="primary" onClick={handleSheetSelection}>
                  Select Google Sheet
                </Button>
              </motion.div>
            ) : !sheetName ? (
              // Sheet name selection
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                transition={{ duration: 0.5 }}
                className="select-sheet-container"
              >
                <div className="select-sheet-container">
                  <div style={{ marginTop: '20px' }}>
                    <Typography variant="h6">Select Sheet:</Typography>
                    <select
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      style={{
                        padding: '8px',
                        marginTop: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#1e1e1e', color: '#ffffff' }}>
                        Select a sheet
                      </option>
                      {sheets.map((name, index) => (
                        <option
                          key={index}
                          value={name}
                          style={{ backgroundColor: '#1e1e1e', color: '#ffffff' }}
                        >
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : isProcessing ? (
              // Show loading indicator while processing
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                transition={{ duration: 0.5 }}
                className="loading-container"
              >
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <CircularProgress color="primary" />
                  <Typography variant="body1" style={{ marginTop: '10px' }}>
                    Loading dances...
                  </Typography>
                </div>
              </motion.div>
            ) : (
              // After dances are loaded
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                transition={{ duration: 0.5 }}
              >
                <Container className="container">
                  {dances.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                      <Typography variant="h5">Arrange Dances</Typography>
                      <DancePreference dances={dances} setPreferences={setPreferences} />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={submitPreferences}
                        disabled={isProcessing}
                        style={{ marginTop: '20px' }}
                      >
                        {isProcessing ? <CircularProgress size={24} /> : 'Generate Schedules'}
                      </Button>
                    </div>
                  )}
                  {results.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                      <Typography variant="h5">Results</Typography>
                      <Grid container spacing={2} justifyContent="center" style={{ marginTop: '20px' }}>
                        {results.map((result, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <motion.div
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              variants={resultVariants}
                            >
                              <Card className="result-card">
                                <CardContent>
                                  <Typography variant="h6">
                                    Schedule {index + 1} ({result.cost} Collisions)
                                  </Typography>
                                  <ol>
                                    {result.schedule.map((dance, idx) => (
                                      <li key={idx}>{dance}</li>
                                    ))}
                                  </ol>
                                  {result.collisions.length > 0 && (
                                    <div>
                                      <Typography variant="subtitle1">Collisions Detected:</Typography>
                                      {result.collisions.map((collision, idx) => (
                                        <Typography variant="body2" key={idx}>
                                          {collision.member}: '{collision.previous_dance}' and '{collision.current_dance}'
                                        </Typography>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          </Grid>
                        ))}
                      </Grid>
                    </div>
                  )}
                </Container>
              </motion.div>
            )}
          </>
        ) : (
          // User is not logged in, show login prompt
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.5 }}
            className="login-container"
          >
            <TypingText text="Please log in with Google to get started" />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Button variant="contained" color="primary" onClick={() => login()} style={{ marginTop: '20px' }}>
                Sign in with Google
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;