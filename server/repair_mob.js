require('dotenv').config();
const connectDB = require('./config/db');
const AllocationTrade = require('./models/AllocationTrade');
const LedgerEntry = require('./models/LedgerEntry');

async function fix() {
    await connectDB();
    const oldNum = "11231231231";
    const newNum = "8433634055";

    console.log(`Migrating ${oldNum} to ${newNum}...`);

    await AllocationTrade.updateMany({ mob_num: oldNum }, { $set: { mob_num: newNum } });
    await LedgerEntry.updateMany({ mob_num: oldNum }, { $set: { mob_num: newNum } });

    console.log("Migration complete.");
    process.exit(0);
}

fix();
