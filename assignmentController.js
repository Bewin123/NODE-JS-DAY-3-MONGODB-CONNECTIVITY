// assignmentController.js
const Mentor = require("./models/mentor");
const Student = require("./models/student");

// Assign student to mentor
async function assignStudentToMentor(req, res) {
  try {
    const { studentId, mentorId } = req.body;
    const mentor = await Mentor.findById(mentorId);
    const student = await Student.findByIdAndUpdate(
      studentId,
      { mentor: mentorId },
      { new: true }
    );
    if (!mentor.students.includes(studentId)) {
      mentor.students.push(studentId);
      await mentor.save();
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Change mentor for student
async function changeStudentMentor(req, res) {
  try {
    const { studentId, newMentorId } = req.body;
    const oldMentor = await Mentor.findOne({ students: studentId });
    const newMentor = await Mentor.findById(newMentorId);
    if (oldMentor) {
      oldMentor.students = oldMentor.students.filter((id) => id !== studentId);
      await oldMentor.save();
    }
    const student = await Student.findByIdAndUpdate(
      studentId,
      { mentor: newMentorId },
      { new: true }
    );
    if (newMentor && !newMentor.students.includes(studentId)) {
      newMentor.students.push(studentId);
      await newMentor.save();
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Show all students for a particular mentor
async function getStudentsForMentor(req, res) {
  try {
    const { mentorId } = req.params;
    const mentor = await Mentor.findById(mentorId).populate("students");
    res.json(mentor.students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Show the previously assigned mentor for a particular student
async function getPreviousMentorForStudent(req, res) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate("mentor");
    res.json(student.mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  assignStudentToMentor,
  changeStudentMentor,
  getStudentsForMentor,
  getPreviousMentorForStudent,
};
