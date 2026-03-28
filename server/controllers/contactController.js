const Contact = require('../models/Contact');

// @route   GET /api/contact
// @desc    Get contact details
// @access  Public
const getContactDetails = async (req, res) => {
    try {
        let contact = await Contact.findOne();
        if (!contact) {
            contact = await Contact.create({}); // Creates default document if empty
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contact details', error: error.message });
    }
};

// @route   PUT /api/contact
// @desc    Update contact details
// @access  Private/Admin
const updateContactDetails = async (req, res) => {
    try {
        const { email, phone, address, supportText } = req.body;
        
        let contact = await Contact.findOne();
        if (!contact) {
            contact = new Contact({ email, phone, address, supportText });
        } else {
            if (email) contact.email = email;
            if (phone) contact.phone = phone;
            if (address) contact.address = address;
            if (supportText) contact.supportText = supportText;
        }
        
        const updatedContact = await contact.save();
        res.status(200).json(updatedContact);
    } catch (error) {
        res.status(500).json({ message: 'Error updating contact details', error: error.message });
    }
};

module.exports = {
    getContactDetails,
    updateContactDetails
};
