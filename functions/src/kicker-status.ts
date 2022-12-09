import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface IKickerData {
  endTime: string;
  startTime: string;
  status: boolean;
}

const db = admin.firestore();

exports.updateTime = functions.database
  .ref('/Kicker')
  .onUpdate(async (change, _context) => {
    try {
      if (change.after.exists()) {
        const prefix = process.env.PREFIX;
        const valBefore: IKickerData = change.before.val();
        const valAfter: IKickerData = change.after.val();
        if (valBefore.endTime != valAfter.endTime) {
          await db.collection(prefix + 'Playtime').add({
            startTime: valAfter.startTime,
            endTime: valAfter.endTime,
          });
        }
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }

    //   if (val.status) {
    //     console.log(val);
    //     db.collection(prefix + 'Playtime').add({
    //       startTime: val.startTime,
    //       endTime: val.endTime,
    //     });
    //     // col.add({ startTime: val.startTime, endTime: val.endTime });
    //     // console.log(col);
    //     // const startTime = Number(val.startTime);
    //     // const endTime = Number(val.endTime);
    //     // const difference = (endTime - startTime) / 60;
    //     // const endDate = new Date(endTime * 1000);
    //     // const dataYear = endDate.getFullYear();
    //     // const dataMonth = endDate.getMonth() + 1;
    //     // const dataDay = endDate.getDate();
    //     // const dataHour = endDate.getHours();
    //     // console.log(difference, dataYear, dataMonth, dataDay, dataHour);
    //   }

    // const docRef = db.doc('T-Playtime/2022');
    // const docSnap = await docRef.get();
    // if (docSnap.exists) {
    //   const actualData = docSnap.get('1');
    //   if (actualData) {
    //     console.log(actualData['1']);
    //   }
    //   //   console.log(actualData);
    // }
    // const docData = docSnap.data() ?? {};
    // console.log(docData[3]);
  });
