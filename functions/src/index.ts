// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require('firebase-admin');
admin.initializeApp();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const newUser = require('./new-user');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const updateUsersAndTeamsI = require('./update-users-teams');

/* Update stats for Users and Teams when match is added to firestore in production environment */
exports.updateUsersAndTeams = updateUsersAndTeamsI.updateUsersAndTeams;

/* Update stats for Users and Teams when match is added to firestore in testing environment */
exports.updateUsersAndTeamsT = updateUsersAndTeamsI.updateUsersAndTeamsT;
// exports.updateUsersAndTeams = updateUsersAndTeams.updateUsersAndTeams;

/* When a new user is added to firebase, this function gets triggered.
   It adds a new user to firestore. */
exports.newUser = newUser.newUser;
