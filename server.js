const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const querySearch = req.query.search || ''; 
    const limit = 3;                            
    const offset = (page - 1) * limit;         

    let countQuery = 'SELECT COUNT(*) AS total FROM siswa';
    let selectQuery = 'SELECT * FROM siswa';
    let params = [];

    if (querySearch) {
        countQuery += ' WHERE name LIKE ?';
        selectQuery += ' WHERE name LIKE ?';
        params.push(`%${querySearch}%`);
    }

   
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }

        const totalData = countResult ? countResult.total : 0;
        const pages = Math.ceil(totalData / limit); 

        let selectParams = [...params];
        selectQuery += ' LIMIT ? OFFSET ?';
        selectParams.push(limit, offset);

        db.all(selectQuery, selectParams, (err, rows) => {
            if (err) {
                return res.status(500).send("Database error: " + err.message);
            }

            res.render('table', { 
                rows, 
                page, 
                pages, 
                querySearch,
                currentOffset: offset 
            });
        });
    });
});

app.get('/add', (req, res) => {
    res.render('form', { item: {} });
});

app.post('/add', (req, res) => {
    const { name, height, weight, birthdate, ismarried } = req.body; 
    const query = 'INSERT INTO siswa (name, height, weight, birthdate, ismarried) VALUES (?, ?, ?, ?, ?)';
    const marriedValue = ismarried ? 1 : 0;

    db.run(query, [name, height, weight, birthdate, marriedValue], (err) => {
        if (err) {
            return res.status(500).send("Failed to save data: " + err.message);
        }
        res.redirect('/'); 
    }); 
}); 

app.get('/update/:id', (req, res) => {
    const id = req.params.id;
    const page = req.query.page || 1;
    const querySearch = req.query.search || '';

    const query = 'SELECT * FROM siswa WHERE id = ?';

    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }
        if (!row) {
            return res.status(404).send("Data tidak ditemukan");
        }

        db.get('SELECT COUNT(*) AS total FROM siswa' + (querySearch ? ' WHERE name LIKE ?' : ''), 
        querySearch ? [`%${querySearch}%`] : [], (err, countResult) => {
            if (err) return res.status(500).send("Database error");

            const limit = 5;
            const totalData = countResult ? countResult.total : 0;
            const pages = Math.ceil(totalData / limit);
            res.render('form', { 
                item: row,
                page: page,
                pages: pages,
                querySearch: querySearch
            });
        });
    });
});

app.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, height, weight, birthdate, isMarried } = req.body;   
    const page = req.query.page || 1;
    const querySearch = req.query.search || '';
    
    const query = 'UPDATE siswa SET name = ?, height = ?, weight = ?, birthdate = ?, ismarried = ? WHERE id = ?';
    
    
    const marriedValue = (isMarried === 'true' || isMarried === 1 || isMarried === true) ? 1 : 0;

    db.run(query, [name, height, weight, birthdate, marriedValue, id], (err) => {
        if (err) {
            return res.status(500).send("Failed to update data: " + err.message);
        }
        
  
        res.redirect(`/?page=${page}${querySearch ? '&search=' + encodeURIComponent(querySearch) : ''}`);
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

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
