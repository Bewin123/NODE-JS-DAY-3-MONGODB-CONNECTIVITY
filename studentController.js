// studentController.js
const Student = require("./models/student");

// Create student
async function createStudent(req, res) {
  try {
    const { name } = req.body;
    const student = await Student.create({ name });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createStudent };
