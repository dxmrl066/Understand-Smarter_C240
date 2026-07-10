require('dotenv').config();

const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage(); // Forces files to stay in memory buffers
const upload = multer({ storage: storage });
const pdfParse = require('pdf-parse');
// Keep your team's quiz generator import
const generateQuiz = require("./services/quizGenerator");
// ADD THIS LINE right below it to bring in your new mindmap function!
// Ensure there are NO curly braces around generateMindMap
const generateMindMap = require("./services/mindmapGenerator");

const app = express();
const FEEDBACK_WEBHOOK_URL = (process.env.FEEDBACK_WEBHOOK_URL || 'https://n8ngc.codeblazar.org/webhook/Feedback').trim();

function submitFeedbackToWebhook(payload) {
  return new Promise((resolve, reject) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(FEEDBACK_WEBHOOK_URL);
    } catch (error) {
      reject(new Error('The feedback webhook URL is invalid.'));
      return;
    }

    const data = JSON.stringify(payload);
    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = transport.request(options, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: responseBody });
        } else {
          reject(new Error(`Webhook request failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const DEFAULT_PORT = 3000;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <-- Add this line
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('pages/home', {
    page: 'home',
    title: 'Understand Smarter, Not Harder',
    description: 'A friendly learning hub for polytechnic students.'
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', {
    page: 'about',
    title: 'About',
    description: 'How this project supports students.'
  });
});

app.get('/ai-assistant', (req, res) => {
  res.render('pages/ai-assistant', {
    page: 'ai-assistant',
    title: 'Telegram Study Buddy',
    description: 'A Telegram-first study companion powered by n8n.'
  });
});

app.get('/study-tools', (req, res) => {
  res.render('pages/study-tools', {
    page: 'study-tools',
    title: 'Study Tools',
    description: 'Practical tools for calm, steady learning.',
    plan: null
  });
});

app.get('/study-tools/reminders', (req, res) => {
  res.render('pages/study-tools', {
    page: 'study-tools',
    title: 'Study Tools',
    description: 'Practical tools for calm, steady learning.',
    plan: 'reminders',
    reminderPlan: {
      title: 'Your study reminder plan',
      steps: [
        'Review your subject notes for 15 minutes after class.',
        'Set a short quiz each evening for one topic.',
        'Take a 5-minute break after every focused review session.',
        'Check off what you revised and keep the plan simple.'
      ]
    }
  });
});

app.get('/study-tools/quiz', (req, res) => {
  res.render('pages/study-tools', {
    page: 'study-tools',
    title: 'Study Tools',
    description: 'Practical tools for calm, steady learning.',
    plan: 'quiz',
    quizPlan: {
      title: 'Your quiz generation plan',
      steps: [
        'Pick one topic and choose 5 key questions.',
        'Write a short answer or multiple choice question for each.',
        'Try the quiz after a quick review to reinforce memory.',
        'Review any mistakes and add one follow-up question.'
      ]
    }
  });
});

app.get('/resources', (req, res) => {
  res.render('pages/resources', {
    page: 'resources',
    title: 'Resources',
    description: 'Helpful materials for revision and confidence building.'
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', {
    page: 'contact',
    title: 'Contact & Feedback',
    description: 'Share feedback or ask for help.',
    // Provide sensible defaults so the template can safely reference `values`
    values: { name: '', email: '', message: '' },
    errors: []
  });
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim();
  const trimmedMessage = (message || '').trim();
  const errors = [];

  if (!trimmedName) {
    errors.push('Name is required.');
  }
  if (!trimmedEmail) {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.push('Please enter a valid email address.');
  }
  if (!trimmedMessage) {
    errors.push('Message is required.');
  }

  if (errors.length) {
    return res.render('pages/contact', {
      page: 'contact',
      title: 'Contact & Feedback',
      description: 'Share feedback or ask for help.',
      errors,
      values: {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage
      }
    });
  }

  try {
    await submitFeedbackToWebhook({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage
    });

    return res.render('pages/contact', {
      page: 'contact',
      title: 'Contact & Feedback',
      description: 'Share feedback or ask for help.',
      success: true,
      values: {
        name: '',
        email: '',
        message: ''
      }
    });
  } catch (error) {
    console.error('Feedback webhook submission failed:', error);

    return res.render('pages/contact', {
      page: 'contact',
      title: 'Contact & Feedback',
      description: 'Share feedback or ask for help.',
      errors: ['We could not send your feedback right now. Please try again.'],
      values: {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage
      }
    });
  }
});


// ==========================
// AI Quiz API
// ==========================

app.post('/api/quiz', async (req, res) => {
  try {
    const { subject, difficulty, count, type } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Please select a module.'
      });
    }

    const quiz = await generateQuiz(
      subject,
      difficulty,
      count,
      type
    );

    res.json({
      success: true,
      quiz
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate quiz.'
    });
  }
});

// Make sure this route configuration is used in app.js
// 2. Update your existing POST route to look like this:
app.post('/api/generate-mindmap', upload.single('notesFile'), async (req, res) => {
    try {
        let extractedNotes = req.body.notes || "";

        if (req.file) {
            extractedNotes += "\n" + req.file.buffer.toString('utf-8');
        }

        if (!extractedNotes.trim()) {
            return res.status(400).json({ error: "Please enter a topic, paste text, or upload a .txt document." });
        }

        let result = await generateMindMap(extractedNotes);

        if (result) {
            // 1. Remove markdown fences if the LLM snuck them in
            result = result.replace(/```mermaid/g, "").replace(/```/g, "").trim();

            // 2. Fix indentation to ensure it uses uniform 2-space increments
            result = result.replace(/^\s+/gm, (match) => "  ".repeat(Math.floor(match.length / 2)));

            // 3. BULLETPROOF SANITIZER: If Gemini forgot quotes on a line, wrap it safely
            let lines = result.split('\n');
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let trimmed = line.trim();
                
                // Skip the first root declaration line
                if (trimmed === 'mindmap' || trimmed === '') continue;
                
                // If the line doesn't start with a quote, find the text and wrap it
                if (!trimmed.startsWith('"')) {
                    let indent = line.match(/^\s*/)[0];
                    lines[i] = `${indent}"${trimmed.replace(/"/g, '')}"`;
                }
            }
            result = lines.join('\n');
        }

        res.json({ result });

    } catch (error) {
        console.error("Backend text processing failed:", error);
        res.status(500).json({ error: "Internal server error occurred while reading your notes." });
    }
});
// ==========================
// Start Server
// ==========================

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Website running at http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
    if (port === DEFAULT_PORT) {
      console.error(`Try restarting the app with a different port, for example: PORT=3001 node app.js`);
    }
    process.exit(1);
  }

  console.error('Server error:', error);
  process.exit(1);
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack);
  res.status(500).send(err.stack);
});