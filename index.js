const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// MongoDB connection URL
mongoose.connect("mongodb+srv://bewinshaji01:bewin1302@cluster0.e6nzcye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("mongodb connected");
    // Expected output: "Success!"
  }).catch((error) => {
    console.log(error)
  });




// Mentor schema
const mentorSchema = new mongoose.Schema({
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});
const Mentor = mongoose.model("Mentor", mentorSchema);

// Student schema
const studentSchema = new mongoose.Schema({
  name: String,
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentor",
    default: null,
  },
});
const Student = mongoose.model("Student", studentSchema);

// Middleware for parsing JSON request bodies
app.use(express.json());

// API to create a mentor
app.post("/mentors", async (req, res) => {
  const { name } = req.body;
  try {
    const mentor = new Mentor({ name });
    await mentor.save();
    res.json(mentor);
  } catch (error) {
    res.status(500).json({ error: "Could not create mentor" });
  }
});

// API to create a student
app.post("/students", async (req, res) => {
  const { name } = req.body;
  try {
    const student = new Student({ name });
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Could not create student" });
  }
});

// API to assign a student to a mentor
app.put("/assign-student-to-mentor/:mentorId", async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;
  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      if (student && !student.mentorId) {
        mentor.students.push(studentId);
        student.mentorId = mentorId;
        await student.save();
      }
    }

    await mentor.save();
    res.json({ message: "Students assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to assign or change mentor for a particular student
app.put("/assign-or-change-mentor/:studentId/:mentorId", async (req, res) => {
  const { studentId, mentorId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    if (student.mentorId && student.mentorId.toString() === mentorId) {
      return res
        .status(400)
        .json({ error: "Student already assigned to this mentor" });
    }

    if (student.mentorId) {
      const prevMentor = await Mentor.findById(student.mentorId);
      prevMentor.students.pull(studentId);
      await prevMentor.save();
    }

    mentor.students.push(studentId);
    student.mentorId = mentorId;

    await mentor.save();
    await student.save();

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to show all students for a particular mentor
app.get("/students-for-mentor/:mentorId", async (req, res) => {
  const { mentorId } = req.params;
  try {
    const students = await Student.find({ mentorId });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to show the previously assigned mentor for a particular student
app.get("/previous-mentor/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const prevMentor = await Mentor.findById(student.mentorId);
    if (!prevMentor) {
      return res.json({ message: "No previous mentor assigned" });
    } else {
      res.json(prevMentor);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to fetch and display all mentors and students in tabular column format
app.get("/mentor-student-details", async (req, res) => {
  try {
    const mentors = await Mentor.find().populate("students");
    const students = await Student.find();
    const mentorTable = generateTable("Mentors", mentors, [
      "id",
      "name",
      "students",
    ]);
    const studentTable = generateTable("Students", students, [
      "id",
      "name",
      "mentorId",
    ]);

    const htmlResponse = `
      <html>
        <head>
          <style>
            table {
              width: 50%;
              margin: 20px auto;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              border: 1px solid #ddd;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>Mentor and Student Details</h1>
          ${mentorTable}
          ${studentTable}
        </body>
      </html>
    `;

    res.send(htmlResponse);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to generate HTML table
function generateTable(heading, data, fields) {
  let table = `<h2>${heading}</h2>`;
  table += `<table><tr>${fields
    .map((field) => `<th>${field}</th>`)
    .join("")}</tr>`;
  data.forEach((item) => {
    table += "<tr>";
    fields.forEach((field) => {
      table += `<td>${
        field === "students"
          ? item.students.map((student) => student.name).join(", ")
          : item[field]
      }</td>`;
    });
    table += "</tr>";
  });
  table += "</table>";
  return table;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
