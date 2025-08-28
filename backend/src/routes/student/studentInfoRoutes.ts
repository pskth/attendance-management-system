// routes/studentInfo.ts
import express from "express";
import DatabaseService from '../../lib/database'; 
// Adjust the import path as necessary


const router = express.Router();


// GET /students/:studentId
router.get("/students/:userId", async (req, res) => {
  try {
    const { userId } = req.params;   //gets the userId from the url

    if (!userId) {
      return res.status(400).json({ error: "userId is required" }); // checks whether the userId is valid or present
    }

    const prisma = DatabaseService.getInstance();

// 2. Get user row
const user = await prisma.user.findUnique({
  where: { id: userId }
});
console.log("user",user)

// 1. Get student row
const student = await prisma.student.findUnique({
  where: { userId: userId }
});
console.log("student :",student , "userId:", userId)

if (!student) {
  return res.status(404).json({ error: "Student not found" });
}



// 3. Get department row
const department = await prisma.department.findUnique({
  where: { id: student.department_id as string }
});
//4.get college name 
const college = await prisma.college.findUnique({
  where: { id: student.college_id as string }
});

// 4. Shape the final data
if(user && department && college) {
       res.json( {
    user_id: user.id,
    name: user.name,
    usn: user.username,
  phone: user.phone,
  email: user.email,
  college_name: college.name,
  semester: student.semester,
  department: department.name,
  academic_year:student.batchYear,
  photo_url: user.photoUrl || "" ,
}) }else{
  res.json({
    user_id: null,
    name: null,
    usn: null,
    phone: null,
    email: null,
    college_name: null,
    semester: null,
    department: null,
    photo_url: null
  });
}


  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});



export default router;  
