const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');

mongoose.connect('mongodb+srv://chandan:chandan11@feelfree.mplt9kx.mongodb.net/tradin_web?appName=FeelFree')
  .then(async () => {
    try {
      const numbers = ['9876543210', '0987654321', '1234567890'];
      const users = await User.find({ mob_num: { $in: numbers } });
      console.log('Found in Users:', users.map(u => ({ name: u.user_name, mob: u.mob_num, type: typeof u.mob_num })));

      const admins = await Admin.find({ mob_num: { $in: numbers } });
      console.log('Found in Admins:', admins.map(a => ({ name: a.user_name, mob: a.mob_num, type: typeof a.mob_num })));

    } catch (err) {
      console.error(err);
    } finally {
      mongoose.disconnect();
    }
  });
