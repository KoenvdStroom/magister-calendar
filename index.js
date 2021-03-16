const magister = require("magister-api-key");
const fs = require('fs');
const util = require('util');
const readline = require('readline');
const {google} = require('googleapis');
const request = require('request');

const readFile = util.promisify(fs.readFile);
const TOKEN_PATH = 'token.json';
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), createEvent);
});

// fs.readFile('details.json', async (err, content) => {
//   if(err) throw err;
//   var dets = JSON.parse(content);
//   var apiKey = await magister.get(dets['url'], dets['username'], dets['password']);
//   getLessons(new Date(), new Date(), apiKey)
// })





function createEvent(auth){
  const calendar = google.calendar({version: 'v3', auth});

  calendar.events.insert({calendarId:'primary', resource:{
    "summary": "Test",
    "start": {"dateTime": Date.now(), "timeZone": "Europe/Amsterdam"},
    "end": {"dateTime": new Date(Date.now() + 30*60000), "timeZone": "Europe/Amsterdam"},
  }}, (err, res) =>{
    if(err) throw err;
    console.log(res)
  });
}

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar',
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err2) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}



/**
 * 
 * @param {Date} startTime 
 * @param {Date} stopTime 
 * @param {String} apiKey
 */

async function getLessons(startTime, stopTime, apiKey){
  var url = `https://pac.magister.net/api/personen/12025/afspraken?status=1&tot=${stopTime.toISOString().split('T')[0]}&van=${startTime.toISOString().split('T')[0]}`
  request.get(url, {
    'auth': {
      'bearer': apiKey
    }
  }, (error, responce, body)  => {
    if(error) throw error;
    console.log(body);
  });
}