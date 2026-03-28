const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    email: { type: String, default: 'support@smartsip.com' },
    phone: { type: String, default: '+1 (800) 123-4567' },
    address: { type: String, default: '123 Financial District, Trading Tower, NY 10001' },
    supportText: { type: String, default: 'If you have any questions, need support, or have generic inquiries, feel free to reach out to our administration team.' }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
