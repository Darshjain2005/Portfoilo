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
  origin: ['http://localhost:3001','http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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


//search
app.get('/get-profile/:employee_id', (req, res) => {
  const { employee_id } = req.params;

  // Query for employee details
  const userQuery = 'SELECT * FROM employees WHERE id = ?';

  // Query for projects and certificates
  const projectsQuery = 'SELECT * FROM projects WHERE employee_id = ?';
  const certificatesQuery = 'SELECT * FROM certificates WHERE employee_id = ?';

  // Execute all queries in parallel
  Promise.all([
      new Promise((resolve, reject) => {
          db.query(userQuery, [employee_id], (err, result) => {
              if (err) reject(err);
              else resolve(result[0]); // Assuming one employee per ID
          });
      }),
      new Promise((resolve, reject) => {
          db.query(projectsQuery, [employee_id], (err, result) => {
              if (err) reject(err);
              else resolve(result);
          });
      }),
      new Promise((resolve, reject) => {
          db.query(certificatesQuery, [employee_id], (err, result) => {
              if (err) reject(err);
              else resolve(result);
          });
      })
  ])
  .then(([user, projects, certificates]) => {
      if (!user) {
          return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ user, projects, certificates });
  })
  .catch(err => {
      console.error(err);
      res.status(500).send('Server Error');
  });
});


// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

//create a employee account
app.post('/create-employee-account', (req, res) => {
  console.log('Request body:', req.body);

  const { full_name, email, username, password, confirmPassword } = req.body;

  // Check if all required fields are present
  if (!full_name || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
  }

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
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

// Create Employer Account Endpoint
app.post('/create-employer-account', async (req, res) => {
  const { company_name, email, username, password } = req.body; // ✅ Updated variable name

  if (!company_name || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required." });
  }

  try {
      // Check if username or email already exists
      const checkQuery = "SELECT * FROM employers WHERE email = ? OR username = ?";
      db.query(checkQuery, [email, username], async (err, results) => {
          if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ message: "Server error" });
          }

          if (results.length > 0) {
              return res.status(400).json({ message: "Email or Username already exists." });
          }

          // Hash the password before storing
          const hashedPassword = await bcrypt.hash(password, 10);

          // ✅ Fix the INSERT query to match your DB schema
          const insertQuery = `
              INSERT INTO employers (company_name, email, username, password) 
              VALUES (?, ?, ?, ?)
          `;

          db.query(insertQuery, [company_name, email, username, hashedPassword], (err, result) => {
              if (err) {
                  console.error("Error inserting employer:", err);
                  return res.status(500).json({ message: "Error creating employer account" });
              }

              res.status(201).json({ message: "Employer account created successfully!" });
          });
      });
  } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
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

//Employer login
app.post('/employer-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  const sql = 'SELECT * FROM employers WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).send('Error during login.');
    if (results.length === 0) return res.status(401).send('Invalid credentials.');

    const employer = results[0];
    bcrypt.compare(password, employer.password, (err, match) => {
      if (err) return res.status(500).send('Error comparing passwords.');
      if (!match) return res.status(401).send('Invalid credentials.');

      const token = jwt.sign({ id: employer.id, role: 'employer' }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, userId: employer.id });  // Send userId along with the token
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

// Route to update About Me section
app.post('/update-about-me', (req, res) => {
  const { user_id, about_me_text } = req.body;

  // Validate input
  if (!user_id || !about_me_text) {
    return res.status(400).json({ error: 'User  ID and About Me text are required' });
  }

  // Check if the user already has an entry in the about_me table
  const checkQuery = 'SELECT * FROM about_me WHERE user_id = ?';
  db.query(checkQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error checking about_me entry:', err);
      return res.status(500).json({ error: 'Error checking about me entry' });
    }

    if (results.length > 0) {
      // Update existing entry
      const updateQuery = 'UPDATE about_me SET about_me_text = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
      db.query(updateQuery, [about_me_text, user_id], (err, updateResults) => {
        if (err) {
          console.error('Error updating about me section:', err);
          return res.status(500).json({ error: 'Error updating about me section' });
        }
        res.json({ message: 'About me section updated successfully' });
      });
    } else {
      // Insert new entry
      const insertQuery = 'INSERT INTO about_me (user_id, about_me_text) VALUES (?, ?)';
      db.query(insertQuery, [user_id, about_me_text], (err, insertResults) => {
        if (err) {
          console.error('Error inserting about me section:', err);
          return res.status(500).json({ error: 'Error inserting about me section' });
        }
        res.json({ message: 'About me section created successfully' });
      });
    }
  });
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

    // Validate input
    if (!user_id || !contact_email || !linkedin_profile) {
      return res.status(400).json({ error: 'User  ID, contact email, and LinkedIn profile are required' });
    }

    // Check if the user already has an entry in the contact_me table
    const checkQuery = 'SELECT * FROM contact_me WHERE user_id = ?';
    db.query(checkQuery, [user_id], (err, results) => {
      if (err) {
        console.error('Error checking contact_me entry:', err);
        return res.status(500).json({ error: 'Error checking contact info entry' });
      }

      if (results.length > 0) {
        // Update existing entry
        const updateQuery = 'UPDATE contact_me SET contact_email = ?, linkedin_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
        db.query(updateQuery, [contact_email, linkedin_profile, user_id], (err, updateResults) => {
          if (err) {
            console.error('Error updating contact info:', err);
            return res.status(500).json({ error: 'Error updating contact info' });
          }
          res.json({ message: 'Contact info updated successfully.' });
        });
      } else {
        // Insert new entry
        const insertQuery = 'INSERT INTO contact_me (user_id, contact_email, linkedin_profile) VALUES (?, ?, ?)';
        db.query(insertQuery, [user_id, contact_email, linkedin_profile], (err, insertResults) => {
          if (err) {
            console.error('Error inserting contact info:', err);
            return res.status(500).json({ error: 'Error inserting contact info' });
          }
          res.json({ message: 'Contact info created successfully.' });
        });
      }
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Error updating contact info' });
  }
});


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
