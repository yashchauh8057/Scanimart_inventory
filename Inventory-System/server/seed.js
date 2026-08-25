require('dotenv').config();
const { database } = require('./firebase');
const { data } = require('./seed-data');

database().ref().set(data)
  .then(() => { console.log('Demo data was written to Firebase.'); process.exit(0); })
  .catch(error => { console.error(error); process.exit(1); });
