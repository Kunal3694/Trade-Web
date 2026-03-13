const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://chandan:chandan11@feelfree.mplt9kx.mongodb.net/tradin_web?appName=FeelFree')
  .then(async () => {
    try {
      const users = await User.find({ client_id: { $eq: null } });
      console.log('Users without client_id:', users.length);
      let count = 0;
      for (let u of users) {
        const rnd = Math.floor(100000 + Math.random() * 900000);
        await User.updateOne({ _id: u._id }, { $set: { client_id: 'CID' + rnd } });
        count++;
      }
      console.log('Updated users:', count);
    } catch (err) {
      console.error(err);
    } finally {
      mongoose.disconnect();
    }
  });
