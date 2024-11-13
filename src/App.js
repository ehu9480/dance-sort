import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import DancePreference from './DancePreference';
import { Typography, Button, Container, Card, CardContent, CircularProgress} from '@mui/material';
import Grid from '@mui/material/Grid2';
import TypingText from './TypingText';
import 'animate.css';
import {motion} from 'framer-motion';

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
  const [apisLoaded, setApisLoaded] = useState(false);

  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

  // Load Google API client and Picker API
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
    const savedSpreadsheetName = localStorage.getItem('spreadsheetName');
  
    if (savedUser) {
      setUser(savedUser);
    }
  
    const loadApis = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        window.gapi.load('client', async () => {
          console.log('GAPI client loaded for API');
          await window.gapi.client.load('drive', 'v3');
          await window.gapi.client.load('sheets', 'v4');
  
          // Now that gapi client is loaded, set token if we have it
          if (savedToken) {
            setToken(savedToken);
            window.gapi.client.setToken({ access_token: savedToken });
          }
  
          if (savedSpreadsheetId && savedSpreadsheetName) {
            setSpreadsheetId(savedSpreadsheetId);
            setSpreadsheetName(savedSpreadsheetName);
            loadSheetNames(savedSpreadsheetId);
          }
  
          checkIfApisLoaded();
        });
      };
      document.body.appendChild(script1);
  
      const script2 = document.createElement('script');
      script2.src = 'https://apis.google.com/js/picker.js';
      script2.onload = () => {
        console.log('Google Picker API loaded');
        checkIfApisLoaded();
      };
      document.body.appendChild(script2);
    };
  
    const checkIfApisLoaded = () => {
      if (window.gapi && window.google && window.google.picker) {
        setApisLoaded(true);
      }
    };
  
    loadApis();
  }, []);

  useEffect(() => {
    if (sheetName) {
      processSheet();
    }
  }, [sheetName]);
  
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
    localStorage.clear();
  };

  const handleSheetSelection = () => {
    if (!apisLoaded) {
      console.error('Google APIs are not yet loaded.');
      return;
    }
    if (!token) {
      console.error('OAuth token is missing or invalid.');
      return;
    }
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
      if (error.message.includes('401')) {
        alert('Authorization error: Please log in again to refresh the token.');
      }
    }
  };

  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      setSpreadsheetId(doc.id);
      setSpreadsheetName(doc.name); // Save the name
      localStorage.setItem('spreadsheetName', doc.name); // Save to localStorage
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
    }
  };

  // After loading dances from the sheet
  const loadDances = (danceData) => {
    setDances(danceData);
  };

  const processSheet = async () => {
    setIsProcessing(true);
    try {
      // Fetch the sheet data using Google Sheets API
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}`,
      });
      const rows = response.result.values;
  
      if (rows && rows.length > 0) {
        // Assuming the first row contains headers 'Dance' and 'Members'
        const headerRow = rows[0];
        const danceIndex = headerRow.indexOf('Dance');
        if (danceIndex === -1) {
          console.error("Couldn't find 'Dance' column in the sheet.");
        } else {
          const danceData = rows.slice(1).map((row) => row[danceIndex]);
          loadDances(danceData.filter((dance) => dance)); // Filter out empty values
        }
      } else {
        console.error('No data found in the sheet.');
      }
    } catch (error) {
      console.error('Error processing sheet', error);
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
    }
    setIsProcessing(false);
  };
  

  return (
    <div className="App">
      {!token ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20vh' }}
        >
          <TypingText text="Please log in with Google to get started." speed={50} />
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button variant="contained" color="primary" onClick={() => login()} style={{ marginTop: '20px' }}>
              Sign in with Google
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        // Main app content when logged in
        <Container style={{ marginTop: '20px' }}>
          {user && (
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Typography variant="body1" style={{ marginRight: '16px' }}>
                Logged in as: {user.email}
              </Typography>
              <Button color="primary" variant="outlined" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
          {!spreadsheetId ? (
            <Button variant="contained" color="primary" onClick={handleSheetSelection}>
              Select Google Sheet
            </Button>
          ) : (
            <div>
              <Typography variant="h6">Selected Spreadsheet: {spreadsheetName}</Typography>
              <Button variant="outlined" color="primary" onClick={handleSheetSelection} style={{ marginTop: '10px' }}>
                Select a Different Spreadsheet
              </Button>
              <div style={{ marginTop: '20px' }}>
                <Typography variant="body1">Select Sheet:</Typography>
                <select
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  style={{ padding: '8px', marginTop: '10px' }}
                >
                  <option value="">Select a sheet</option>
                  {sheets.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
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
              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                {results.map((result, index) => (
                  <Grid xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          Schedule {index + 1} (Total Collisions: {result.cost})
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
                  </Grid>
                ))}
              </Grid>
            </div>
          )}
        </Container>
      )}
    </div>
  );
}

export default App;