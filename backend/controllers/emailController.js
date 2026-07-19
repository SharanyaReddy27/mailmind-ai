const mongoose = require("mongoose");
const Email = require("../models/Email");
const { isDbConnected } = require("../config/db");

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

const normalizeEmail = (email, index = 0) => ({
  ...email,
  _id: email._id || email.id || `demo-${index + 1}`,
});

let fallbackEmails = demoEmails.map((email, index) => normalizeEmail(email, index));

const getFallbackEmails = () => fallbackEmails.map((email) => ({ ...email }));

const createEmail = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const newEmail = normalizeEmail(
        {
          ...req.body,
          unread: req.body.unread ?? true,
          priority: req.body.priority || "Medium",
        },
        fallbackEmails.length
      );

      fallbackEmails = [newEmail, ...fallbackEmails];
      return res.status(201).json(newEmail);
    }

    const email = await Email.create(req.body);
    return res.status(201).json(email);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateEmail = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const index = fallbackEmails.findIndex((email) => email._id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ message: "Email not found" });
      }

      fallbackEmails[index] = {
        ...fallbackEmails[index],
        ...req.body,
        _id: fallbackEmails[index]._id,
      };

      return res.json(fallbackEmails[index]);
    }

    const email = await Email.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    return res.json(email);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteEmail = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const existingLength = fallbackEmails.length;
      fallbackEmails = fallbackEmails.filter((email) => email._id !== req.params.id);

      if (fallbackEmails.length === existingLength) {
        return res.status(404).json({ message: "Email not found" });
      }

      return res.json({ message: "Email deleted successfully" });
    }

    const email = await Email.findByIdAndDelete(req.params.id);

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    return res.json({ message: "Email deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getEmails = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json(getFallbackEmails());
    }

    const emails = await Email.find().sort({ receivedAt: -1 });
    return res.status(200).json(emails);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve emails",
      error: error.message,
    });
  }
};

const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const email = fallbackEmails.find((item) => item._id === id);

      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      return res.status(200).json(email);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid email ID",
      });
    }

    const email = await Email.findById(id);

    if (!email) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    return res.status(200).json(email);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve email",
      error: error.message,
    });
  }
};

const seedEmails = async (req, res) => {
  try {
    if (!isDbConnected()) {
      if (fallbackEmails.length > 0) {
        return res.status(400).json({ message: "Emails already exist in the database" });
      }

      fallbackEmails = demoEmails.map((email, index) => normalizeEmail(email, index));

      return res.status(201).json({
        message: "Demo emails added successfully",
        count: fallbackEmails.length,
        emails: getFallbackEmails(),
      });
    }

    const existingCount = await Email.countDocuments();

    if (existingCount > 0) {
      return res.status(400).json({ message: "Emails already exist in the database" });
    }

    const emails = await Email.insertMany(demoEmails);

    return res.status(201).json({
      message: "Demo emails added successfully",
      count: emails.length,
      emails,
    });
  } catch (error) {
    return res.status(500).json({
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
