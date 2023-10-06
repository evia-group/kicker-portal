import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface IKickerData {
  endTime: string;
  startTime: string;
  status: boolean;
}

const db = admin.firestore();

exports.updateTime = functions.database.ref('/Kicker').onUpdate((change) => {
  if (change.after.exists()) {
    const prefix = process.env.PREFIX || '';
    const valBefore: IKickerData = change.before.val();
    const valAfter: IKickerData = change.after.val();
    if (valBefore.endTime !== valAfter.endTime) {
      return db.collection(prefix + 'Playtime').add({
        startTime: valAfter.startTime,
        endTime: valAfter.endTime,
      });
    }
  }
  return null;
});
