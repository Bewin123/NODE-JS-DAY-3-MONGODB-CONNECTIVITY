// mentorController.js
const Mentor = require("./models/mentor");

// Create mentor
async function createMentor(req, res) {
  try {
    const { name } = req.body;
    const mentor = await Mentor.create({ name });
    res.status(201).json(mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createMentor };
