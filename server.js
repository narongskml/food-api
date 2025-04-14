const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Sample menu data
const menu = [
    {
        "id": 1,
        "title": "ข้าวผัดกระเพราหมูสับ+ไข่ดาว",
        "price": 50,
        "image": "/uploads/kraprowmoosab.png"
    },
    {
        "id": 2,
        "title": "ข้าวผัดปู",
        "price": 60,
        "image": "/uploads/khowpadpoo.png"
    },
    {
        "id": 3,
        "title": "ส้มตำไทย",
        "price": 50,
        "image": "/uploads/somtamthai.png"
    }   
];

// GET all menu items
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// GET single menu item by ID
app.get('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = menu.find(item => item.id === id);
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
});

// POST new menu item with image
app.post('/api/menu', upload.single('image'), (req, res) => {
    const { title, price } = req.body;
    
    // Validate required fields
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
    }
    
    const newItem = {
        id: menu.length + 1,
        title,
        price: parseFloat(price),
        image: `/uploads/${req.file.filename}`
    };
    
    menu.push(newItem);
    res.status(201).json(newItem);
});

// PUT (update) menu item
app.put('/api/menu/:id', upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id);
    const { title, price } = req.body;
    const item = menu.find(item => item.id === id);
    
    if (!title || !price || !item) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    item.title = title;
    item.price = parseFloat(price);
    
    if (req.file) {
        // Delete old image if exists
        const oldImagePath = path.join(__dirname, item.image);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
        item.image = `/uploads/${req.file.filename}`;
    }
    
    res.json(item);
});
// Patch
app.patch('/api/menu/:id', upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id);
    const { title, price } = req.body;
    const item = menu.find(item => item.id === id);    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }    
    // Update only provided fields
    if (title) {
        item.title = title;
    }
    if (price) {
        item.price = parseFloat(price);
    }
    if (req.file) {
        // Delete old image if exists
        const oldImagePath = path.join(__dirname, item.image);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
        item.image = `/uploads/${req.file.filename}`;
    }
    
    res.json(item);
});
// DELETE menu item
app.delete('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = menu.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    // Delete image file
    const item = menu[index];
    const imagePath = path.join(__dirname, item.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }    
    menu.splice(index, 1);
    res.status(204).send();
});


// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    console.log(req);
    next();
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});