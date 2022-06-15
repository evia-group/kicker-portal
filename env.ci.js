const fs = require('fs');
const path = require('path');
const {version} = require('./package.json');

const dir = "src/environments";
const file = "environment.ts";
const prodFile = "environment.prod.ts";

const firebase = process.env.FIREBASE_DETAILS;

const content = {
  production: true,
  versionNumber: `v${version}`,
  prefix: '',
  globals: {
    team1: 0,
    team2: 1,
    round1: 0,
    round2: 1,
    round3: 2,
  },
  ms: {
    tenant: process.env.MS_TENANT,
  },
  firebase
}.toString();

fs.access(dir, fs.constants.F_OK, (err) => {
  if(err) {
    // Directory doesn't exist
    console.log('src doesn\'t exist, creating now', process.cwd());
    // Create /src
    fs.mkdir(dir, {recursive: true}, (err) => {
      if (err) throw err;
    })
  }
  // Now write to file
  try {
    fs.writeFileSync(dir + "/" + file, content);
    fs.writeFileSync(dir + "/" + prodFile, content);
    console.log('Created successfully in', process.cwd());
    if (fs.existsSync(dir + "/" + file)) {
      console.log('File is created', path.resolve(dir + "/" + file));
      const str = fs.readFileSync(dir + "/" + file).toString();
      console.log(str);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})
