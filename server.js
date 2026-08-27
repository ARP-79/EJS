const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    db.all('SELECT * FROM siswa', (err, rows) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }
        res.render('table', { rows });
    });
});

app.get('/add', (req, res) => {
    res.render('form', { item: {} });
});

app.post('/add', (req, res) => {
    const { name, height, weight, birthdate, isMarried } = req.body; 
    const query = 'INSERT INTO siswa (name, height, weight, birthdate, isMarried) VALUES (?, ?, ?, ?, ?)';
    const marriedValue = isMarried ? 1 : 0;

    db.run(query, [name, height, weight, birthdate, marriedValue], (err) => {
        if (err) {
            return res.status(500).send("Failed to save data: " + err.message);
        }
        res.redirect('/'); 
    }); 
}); 

app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM siswa WHERE id = ?';

    db.run(query, [id], (err) => {
        if (err) {
            return res.status(500).send("Failed to delete data: " + err.message);
        }
        res.redirect('/'); 
    });
});

app.get('/update/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM siswa WHERE id = ?';

    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }
        if (!row) {
            return res.status(404).send("Data tidak ditemukan");
        }
        res.render('form', { item: row });
    });
});

app.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, height, weight, birthdate, isMarried } = req.body;
    
    const query = 'UPDATE siswa SET name = ?, height = ?, weight = ?, birthdate = ?, isMarried = ? WHERE id = ?';
    const marriedValue = isMarried ? 1 : 0;

    db.run(query, [name, height, weight, birthdate, marriedValue, id], (err) => {
        if (err) {
            return res.status(500).send("Failed to update data: " + err.message);
        }
        res.redirect('/');
    });
  
});


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
