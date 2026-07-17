const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Path to local JSON database
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database file if it doesn't exist
function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            admin_scroll_text: "📌 খামারে স্বাগতম! নিয়মিত ওষুধ দিন এবং যত্ন নিন।",
            admin_medicines: {}
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}
initDB();

// Helper to read DB
function readDB() {
    try {
        initDB();
        const content = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error("Error reading database:", e);
        return { admin_scroll_text: "📌 খামারে স্বাগতম!", admin_medicines: {} };
    }
}

// Helper to write DB
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing database:", e);
        return false;
    }
}

// REST APIs
// 1. Get scrolling text
app.get('/api/scroll', (req, res) => {
    const dbData = readDB();
    res.json({ text: dbData.admin_scroll_text });
});

// 2. Update scrolling text
app.post('/api/scroll', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }
    const dbData = readDB();
    dbData.admin_scroll_text = text;
    writeDB(dbData);
    res.json({ success: true, text: dbData.admin_scroll_text });
});

// 3. Get all medicines
app.get('/api/medicines', (req, res) => {
    const dbData = readDB();
    res.json(dbData.admin_medicines || {});
});

// 4. Add new medicine
app.post('/api/medicines', (req, res) => {
    const { birdType, day, medicine, amount, time, note, serial } = req.body;
    if (!birdType || !day || !medicine || !amount || !time) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const dbData = readDB();
    const id = "med_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    
    dbData.admin_medicines[id] = {
        id,
        birdType,
        day,
        medicine,
        amount,
        time,
        note: note || "",
        serial: serial || (Object.keys(dbData.admin_medicines).length + 1)
    };
    
    writeDB(dbData);
    res.json({ success: true, item: dbData.admin_medicines[id] });
});

// 5. Update medicine
app.put('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const { birdType, day, medicine, amount, time, note } = req.body;
    const dbData = readDB();
    
    if (!dbData.admin_medicines[id]) {
        return res.status(404).json({ error: "Medicine not found" });
    }
    
    dbData.admin_medicines[id] = {
        ...dbData.admin_medicines[id],
        birdType: birdType || dbData.admin_medicines[id].birdType,
        day: day || dbData.admin_medicines[id].day,
        medicine: medicine || dbData.admin_medicines[id].medicine,
        amount: amount || dbData.admin_medicines[id].amount,
        time: time || dbData.admin_medicines[id].time,
        note: note !== undefined ? note : dbData.admin_medicines[id].note
    };
    
    writeDB(dbData);
    res.json({ success: true, item: dbData.admin_medicines[id] });
});

// 6. Delete medicine
app.delete('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const dbData = readDB();
    
    if (!dbData.admin_medicines[id]) {
        return res.status(404).json({ error: "Medicine not found" });
    }
    
    delete dbData.admin_medicines[id];
    writeDB(dbData);
    res.json({ success: true });
});

// Root route serves index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
