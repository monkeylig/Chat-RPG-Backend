const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

//process.env.NODE_ENV = 'dev';
process.env.NODE_ENV = 'production';

async function main() {
    if(process.env.NODE_ENV === 'production') {
        // @ts-ignore
        const serviceAccount = require('../sandbox/web-rpg-9000-0729e076463c.json');
        initializeApp({
            credential: cert(serviceAccount)
        });
    }
    else {
        initializeApp({ projectId: "demo-test" });
    }

    const db = getFirestore();
    
    const dailyReports = await db.collection('daily_reports');
    const recentReportsSnap = await dailyReports.orderBy('created', 'desc').limit(10).get();

    let playersSum = 0;
    let reportRows = [];
    recentReportsSnap.forEach(doc => {
        const data = doc.data();
        if(data && data.activePlayersCount) {
            playersSum += data.activePlayersCount;
        }
        reportRows.push({
            Date: data && data.created && data.created.toDate ? data.created.toDate().toISOString().slice(0, 10) : 'N/A',
            'Active Players': data && data.activePlayersCount ? data.activePlayersCount : 0
        });
    });

    console.log('\n=== Recent Daily Reports ===');
    console.table(reportRows);

    const avg = recentReportsSnap.size > 0 ? (playersSum / recentReportsSnap.size).toFixed(2) : 'N/A';
    console.log('='.repeat(35));
    console.log(`30 day average active players: \x1b[32m${avg}\x1b[0m`);
    console.log('='.repeat(35) + '\n');
}

main();
