const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.options('*', cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // Path relative to the current module
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ dest: 'uploads/' });

// Ensure the uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsPath));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

app.get('/get-profile/:user_id', (req, res) => {
  const { user_id } = req.params;

  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, userResult) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Server Error');
      }
      
      const user = userResult[0];

      // Retrieve projects
      const projectsQuery = 'SELECT * FROM projects WHERE user_id = ?';
      db.query(projectsQuery, [user_id], (err, projectsResult) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Server Error');
          }

          // Retrieve certificates
          const certificatesQuery = 'SELECT * FROM certificates WHERE user_id = ?';
          db.query(certificatesQuery, [user_id], (err, certificatesResult) => {
              if (err) {
                  console.error(err);
                  return res.status(500).send('Server Error');
              }

              res.json({
                  user,
                  projects: projectsResult,
                  certificates: certificatesResult
              });
          });
      });
  });
});


// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Create Employee Account
app.post('/create-employee-account', (req, res) => {
  console.log('Request body:', req.body);

  const { full_name, email, username, password } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Check if username or email already exists
  const checkSql = 'SELECT * FROM employees WHERE username = ? OR email = ?';
  db.query(checkSql, [username, email], (err, results) => {
    if (err) {
      console.error('Error checking for existing user:', err);
      return res.status(500).json({ message: 'Error checking for existing user.', error: err });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' }); // Conflict
    }

    // Hash password and create account
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Error hashing password.', error: err });
      }

      const sql = 'INSERT INTO employees (full_name, email, username, password) VALUES (?, ?, ?, ?)';
      db.query(sql, [full_name, email, username, hash], (err, result) => {
        if (err) {
          console.error('Error creating account:', err);
          return res.status(500).json({ message: 'Error creating account.', error: err });
        }
        console.log('Employee account created:', result);
        res.status(201).json({ message: 'Employee account created.' }); // Created
      });
    });
  });
});

// Create Employer Account
app.post('/create-employer-account', (req, res) => {
  const { full_name, email, username, password } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Check if username or email already exists
  const checkSql = 'SELECT * FROM employers WHERE username = ? OR email = ?';
  db.query(checkSql, [username, email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking for existing user.' });

    if (results.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' }); // Conflict
    }

    // Hash password and create account
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error hashing password.' });

      const sql = 'INSERT INTO employers (full_name, email, username, password) VALUES (?, ?, ?, ?)';
      db.query(sql, [full_name, email, username, hash], (err, result) => {
        if (err) return res.status(500).send('Error creating account.');
        res.status(201).json({ message: 'Employer account created.' }); // Created
      });
    });
  });
});

// Employee Login
app.post('/employee-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  const sql = 'SELECT * FROM employees WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).send('Error during login.');
    if (results.length === 0) return res.status(401).send('Invalid credentials.');

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).send('Error comparing passwords.');
      if (!match) return res.status(401).send('Invalid credentials.');

      const token = jwt.sign({ id: user.id, role: 'employee' }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, userId: user.id });  // Send userId along with the token
    });
  });
});

// Employer Login
app.post('/employer-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  const sql = 'SELECT * FROM employers WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).send('Error during login.');
    if (results.length === 0) return res.status(401).send('Invalid credentials.');

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).send('Error comparing passwords.');
      if (!match) return res.status(401).send('Invalid credentials.');

      const token = jwt.sign({ id: user.id, role: 'employer' }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, userId: user.id });  // Send userId along with the token
    });
  });
});

// Search for employers
app.get('/search', (req, res) => {
  const skills = req.query.skills; // Skills to search for
  const certifications = req.query.certifications; // Certifications to search for
  const fullName = req.query.name; // Name to search for (updated to full_name)
  const linkedinProfile = req.query.contactInfo; // LinkedIn profile to search for (updated to linkedin_profile)

  // SQL query to search employers with optional filtering based on skills and other criteria
  const sql = `
    SELECT e.*, GROUP_CONCAT(s.skill_name) AS skills
    FROM employers e
    LEFT JOIN employer_skills es ON e.id = es.employer_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE (s.skill_name LIKE ? OR s.skill_name IS NULL) 
      AND e.certifications LIKE ? 
      AND e.full_name LIKE ? 
      AND e.linkedin_profile LIKE ?
    GROUP BY e.id
  `;

  // Execute the query with the provided parameters
  db.query(sql, [`%${skills}%`, `%${certifications}%`, `%${fullName}%`, `%${linkedinProfile}%`], (err, results) => {
    if (err) {
      return res.status(500).send('Error searching for employers.'); // Handle any errors
    }
    res.json(results); // Return the search results as JSON
  });
});

// Route to update about me section
app.post('/update-about-me', (req, res) => {
  try {
    const { user_id, about_me } = req.body;

    if (!user_id || !about_me) {
      res.status(400).json({ error: 'User  ID and about me are required' });
      return;
    }

    // Update the about me section in the database
    const query = 'UPDATE users SET about_me = ? WHERE user_id = ?';
    db.query(query, [about_me, user_id], (err, results) => {
      console.log('Query Results:', results);
      if (err) {
        console.error('Error updating the about me section:', err);
        res.status(500).json({ error: 'Error updating the about me section' });
      } else {
        res.json({ message: 'About me section updated successfully' });
      }
    });
  } catch (error) {
    console.error('Error updating the about me section:', error);
    res.status(500).json({ error: 'Error updating the about me section' });
  }
});

// Create Skill
app.post('/add-skill', (req, res) => {
  const { skill_name } = req.body;
  
  if (!skill_name) {
    return res.status(400).send({ message: 'Skill name is required.' });
  }

  const sql = 'INSERT INTO skills (skill_name) VALUES (?)';
  db.query(sql, [skill_name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send({ message: 'Skill already exists.' });
      }
      console.error('Error creating skill:', err);
      return res.status(500).send({ message: 'Error creating skill: ' + err.message });
    }
    res.send({ message: 'Skill created successfully.', id: result.insertId });
  });
});

// Link Skill to Employee
app.post('/add-employee-skill', (req, res) => {
  const { employee_id, skill_name } = req.body;

  if (!employee_id || !skill_name) {
    return res.status(400).send({ message: 'Both employee_id and skill_name are required.' });
  }

  // Now link the employee to the skill in the employee_skills table
    const insertSql = 'INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)';
    db.query(insertSql, [employee_id, skill_id], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(200).send({ message: 'Employee skill already exists.' });
        }
        return res.status(500).send({ message: 'Error linking employee with skill.' });
      }
      res.status(200).send({ message: 'Employee skill linked successfully.' });
    });
  });

//Project
app.post('/add-project', (req, res) => {
  const { employee_id, title, description } = req.body; 

  const query = 'INSERT INTO projects (employee_id, title, description) VALUES (?, ?, ?)';
  db.query(query, [employee_id, title, description], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Server Error');
      }
      res.send('Project added successfully.');
  });
});

//Certificate
app.post('/add-certificate', upload.single('certificate_file'), (req, res) => {
  console.log("Received request to add a certificate.");
  const { employee_id, certificate_name } = req.body;
  const certificate_file = req.file ? req.file.path : null; // Get the path of the uploaded file

  // Ensure all required fields are present
  if (!employee_id || !certificate_name || !certificate_file) {
      return res.status(400).send('All fields are required.');
  }

  // Check if the employee exists in the employees table
  const sql = 'SELECT COUNT(*) AS count FROM employees WHERE id = ?';
  db.query(sql, [employee_id], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Error checking employee existence.');
      }

       // Log the employee count to verify
       console.log('Employee Count:', results[0].count); // Add this line

      if (results[0].count === 0) {
          return res.status(404).send('Employee not found.');
      }

      // Insert certificate data into the certificates table
      const insertSql = 'INSERT INTO certificates (employee_id, certificate_name, certificate_file) VALUES (?, ?, ?)';
      db.query(insertSql, [employee_id, certificate_name, certificate_file], (err, result) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Error creating certificate.');
          }
          res.send('Certificate created successfully.');
      });
  });
});

// Save contact information for a user
app.post('/update-contact', (req, res) => {
  try {
    const { user_id, contact_email, linkedin_profile } = req.body;

    if (!user_id || !contact_email || !linkedin_profile) {
      res.status(400).json({ error: 'User  ID, contact email, and LinkedIn profile are required' });
      return;
    }

    const query = 'UPDATE users SET contact_email = ?, linkedin_profile = ? WHERE user_id = ?';
    db.query(query, [contact_email, linkedin_profile, user_id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server Error');
      }
      res.send('Contact info updated successfully.');
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Error updating contact info' });
  }
});

// Resume Generation Route
app.post('/generate-resume', (req, res) => {
  const { name, email, experience, education, skills, objective, projects, certifications, languages, interests } = req.body;

  // Add a console log to check the incoming request data
  console.log('Request Data:', { name, email, experience, education, skills, objective, projects, certifications, languages, interests });

  // Ensure all fields are present
  if (!name || !email || !experience || !education || !skills || !objective || !projects || !certifications || !languages || !interests) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    // Collect the PDF data into a buffer
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"'
      });
      res.end(pdfBuffer); // Send the buffer after PDF generation
    });

    // Add content to the PDF
    doc.font('Helvetica-Bold')
      .fontSize(26)
      .text('Resume', { align: 'center' })
      .moveDown(1.5);

    // Personal Information
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Personal Information', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(14)
      .text(`Name: ${name}`)
      .text(`Email: ${email}`)
      .moveDown(1);

    // Experience
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Experience', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(experience)
      .moveDown(1);

    // Education
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Education', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(education)
      .moveDown(1);

    // Skills
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Skills', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(skills)
      .moveDown(1);

    // Objective
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Objective', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(objective)
      .moveDown(1);

    // Projects
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Projects', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(projects)
      .moveDown(1);

    // Certifications
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Certifications', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(certifications)
      .moveDown(1);

    // Languages
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Languages', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(languages)
      .moveDown(1);

    // Interests
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text('Interests', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(12)
      .text(interests)
      .moveDown(1);

    // End the document
    doc.end();

  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Error generating resume.' });
  }
});


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
