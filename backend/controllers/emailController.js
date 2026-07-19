const mongoose = require("mongoose");
const Email = require("../models/Email");

const demoEmails = [
  {
    senderName: "Rahul Kumar",
    senderEmail: "rahul@example.com",
    subject: "Project meeting",
    snippet: "Can we schedule the project discussion tomorrow?",
    body: "Hello, can we schedule our project discussion tomorrow at 2 PM?",
    priority: "High",
    unread: true,
  },
  {
    senderName: "Placement Cell",
    senderEmail: "placement@college.edu",
    subject: "Internship opportunity",
    snippet: "Applications are open for the software internship.",
    body: "Applications are now open for the software development internship.",
    priority: "Medium",
    unread: true,
  },
  {
    senderName: "Amazon",
    senderEmail: "orders@amazon.in",
    subject: "Your order has been shipped",
    snippet: "Your package is on the way.",
    body: "Your package has been shipped and is expected to arrive soon.",
    priority: "Low",
    unread: false,
  },
];
const createEmail = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const payload = Object.assign({}, req.body, { userId: req.user._id });
    const email = await Email.create(payload);
    res.status(201).json(email);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const updateEmail = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const deleteEmail = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const email = await Email.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getEmails = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const emails = await Email.find({ userId: req.user._id }).sort({ receivedAt: -1 });

    res.status(200).json(emails);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to retrieve emails',
      error: error.message,
    });
  }
};

const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid email ID",
      });
    }

    const email = await Email.findById(id);

    if (!email || !email.userId || email.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.status(200).json(email);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve email",
      error: error.message,
    });
  }
};

const seedEmails = async (req, res) => {
  try {
    const existingCount = await Email.countDocuments();

    if (existingCount > 0) {
      return res.status(400).json({
        message: "Emails already exist in the database",
      });
    }

    const emails = await Email.insertMany(demoEmails);

    res.status(201).json({
      message: "Demo emails added successfully",
      count: emails.length,
      emails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to add demo emails",
      error: error.message,
    });
  }
};
module.exports = {
  getEmails,
  getEmailById,
  seedEmails,
  createEmail,
  updateEmail,
  deleteEmail,
};