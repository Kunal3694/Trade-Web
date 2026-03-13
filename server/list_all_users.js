const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');

mongoose.connect('mongodb+srv://chandan:chandan11@feelfree.mplt9kx.mongodb.net/tradin_web?appName=FeelFree')
  .then(async () => {
    try {
      const allUsers = await User.find({});
      const allAdmins = await Admin.find({});
      console.log('All User phone numbers:');
      console.log(allUsers.map(u => ({name: u.user_name, mob: u.mob_num})));
      console.log('All Admin phone numbers:');
      console.log(allAdmins.map(a => ({name: a.user_name, mob: a.mob_num})));
    } catch (err) {
      console.error(err);
    } finally {
      mongoose.disconnect();
    }
  });
