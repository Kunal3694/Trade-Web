const mongoose = require('mongoose');
const LedgerEntry = require('./models/LedgerEntry');

mongoose.connect('mongodb+srv://chandan:chandan11@feelfree.mplt9kx.mongodb.net/tradin_web?appName=FeelFree')
.then(async () => {
    let match = {};
    match.description = { $not: /^(Master Trade Executed:|Master Trade Closed:)/ };
    
    // Test raw find
    const withFilter = await LedgerEntry.find(match).limit(5);
    console.log('With raw filter find:', withFilter.map(d => d.description));

    // Test aggregate
    const aggregateFilter = await LedgerEntry.aggregate([
        { $match: match }
    ]).limit(5);
    console.log('Aggregate with filter:', aggregateFilter.map(d => d.description));

    const totalRaw = await LedgerEntry.countDocuments({ description: /^Master Trade/ });
    console.log('Total Master Trade docs:', totalRaw);

    const totalFiltered = await LedgerEntry.countDocuments(match);
    console.log('Total filtered docs:', totalFiltered);
    
    process.exit();
}).catch(console.error);
