import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import DancePreference from './DancePreference';

function App() {
  const [token, setToken] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(null);
  const [sheetName, setSheetName] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [dances, setDances] = useState([]);
  const [startDance, setStartDance] = useState('');
  const [endDance, setEndDance] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [apisLoaded, setApisLoaded] = useState(false);

  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

  // Load Google API client and Picker API
  useEffect(() => {
    const loadApis = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        window.gapi.load('client', async () => {
          console.log('GAPI client loaded for API');
          await window.gapi.client.load('drive', 'v3');
          await window.gapi.client.load('sheets', 'v4');
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

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      setToken(tokenResponse.access_token);
      // Set the access token for gapi client
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
    },
    scope: SCOPES,
    flow: 'implicit',
  });

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
      const response = await axios.post('https://us-central1-dancesorterbackend.cloudfunctions.net/process_request', {
        token: token,
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        startDance: startDance || null,
        endDance: endDance || null,
        // Add any additional parameters if needed
      });
      setResults(response.data.results);
      const response2 = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}`, // Adjust the range to match your sheet
      });
      const rows = response2.result.values;
      // Assuming the first row contains headers 'Dance' and 'Members'
      const danceIndex = rows[0].indexOf('Dance');
      const danceData = rows.slice(1).map((row) => row[danceIndex]);
      loadDances(danceData);
    } catch (error) {
      console.error('Error processing sheet', error);
    }
    setIsProcessing(false);
  };

  const submitPreferences = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post('https://us-central1-dancesorterbackend.cloudfunctions.net/process_request', {
        token: token,
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        startDance: startDance || null,
        endDance: endDance || null,
        preferences: preferences,
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('Error processing preferences', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="App">
      <h1>Dance Sorter App</h1>
      {!token ? (
        <button onClick={() => login()}>
          Sign in with Google
        </button>
      ) : (
        <div>
          {!spreadsheetId ? (
            <button onClick={handleSheetSelection}>Select Google Sheet</button>
          ) : (
            <div>
              <p>Selected Spreadsheet ID: {spreadsheetId}</p>
              <label>
                Select Sheet:
                <select value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
                  <option value="">Select a sheet</option>
                  {sheets.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              {sheetName && (
                <div>
                  <label>
                    Start Dance (optional):
                    <input
                      type="text"
                      value={startDance}
                      onChange={(e) => setStartDance(e.target.value)}
                    />
                  </label>
                  <br />
                  <label>
                    End Dance (optional):
                    <input
                      type="text"
                      value={endDance}
                      onChange={(e) => setEndDance(e.target.value)}
                    />
                  </label>
                  <br />
                  <button onClick={processSheet} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Generate Schedules'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {dances.length > 0 && (
        <div>
          <h2>Arrange Dances</h2>
          <DancePreference dances={dances} setPreferences={setPreferences} />
          <button onClick={submitPreferences} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Generate Schedules'}
          </button>
        </div>
      )}
      {results.length > 0 && (
        <div>
          <h2>Results</h2>
          {results.map((result, index) => (
            <div key={index}>
              <h3>
                Schedule {index + 1} (Total Collisions: {result.cost})
              </h3>
              <ol>
                {result.schedule.map((dance, idx) => (
                  <li key={idx}>{dance}</li>
                ))}
              </ol>
              {result.collisions.length > 0 && (
                <div>
                  <h4>Collisions Detected:</h4>
                  {result.collisions.map((collision, idx) => (
                    <p key={idx}>
                      Dancer '{collision.member}' between '{collision.previous_dance}' and '
                      {collision.current_dance}'
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
