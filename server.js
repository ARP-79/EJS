const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 2; // Sesuai kode awal Anda (2 data per halaman)                            
    const offset = (page - 1) * limit;         

    // 1. Ambil semua parameter filter dari URL (Form GET)
    const { name, height, weight, birthdate, isMarried } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM siswa';
    let selectQuery = 'SELECT * FROM siswa';
    
    // 2. Buat kondisi query dinamis menggunakan Array
    let queryConditions = [];
    let params = [];

    if (name && name.trim() !== '') {
        queryConditions.push("name LIKE ?");
        params.push(`%${name}%`);
    }
    if (height && height.trim() !== '') {
        queryConditions.push("height = ?");
        params.push(Number(height));
    }
    if (weight && weight.trim() !== '') {
        queryConditions.push("weight = ?");
        params.push(Number(weight));
    }
    if (birthdate && birthdate.trim() !== '') {
        queryConditions.push("birthdate = ?");
        params.push(birthdate);
    }
    // Filter status nikah (0 untuk Not Yet, 1 untuk Yes)
    if (isMarried === '0' || isMarried === '1') {
        queryConditions.push("ismarried = ?");
        params.push(parseInt(isMarried));
    }

    // 3. Gabungkan kondisi dengan klausa WHERE jika ada filter yang diisi
    if (queryConditions.length > 0) {
        const whereClause = ' WHERE ' + queryConditions.join(' AND ');
        countQuery += whereClause;
        selectQuery += whereClause;
    }

    // Hitung total data berdasarkan filter
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }

        const totalData = countResult ? countResult.total : 0;
        const pages = Math.ceil(totalData / limit); 

        // Tambahkan LIMIT dan OFFSET untuk pagination
        let selectParams = [...params];
        selectQuery += ' LIMIT ? OFFSET ?';
        selectParams.push(limit, offset);

        db.all(selectQuery, selectParams, (err, rows) => {
            if (err) {
                return res.status(500).send("Database error: " + err.message);
            }

            // Kirim variabel filter balik ke EJS agar form tetap terisi teksnya
            res.render('table', { 
                rows, 
                page, 
                pages, 
                queryName: name || '',
                queryHeight: height || '',
                queryWeight: weight || '',
                queryBirthdate: birthdate || '',
                queryIsMarried: isMarried || '',
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
    
    // Ambil state pencarian dari URL sewaktu klik edit
    const { name, height, weight, birthdate, isMarried } = req.query;

    const query = 'SELECT * FROM siswa WHERE id = ?';

    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }
        if (!row) {
            return res.status(404).send("Data tidak ditemukan");
        }

        res.render('form', { 
            item: row,
            page: page,
            queryName: name || '',
            queryHeight: height || '',
            queryWeight: weight || '',
            queryBirthdate: birthdate || '',
            queryIsMarried: isMarried || ''
        });
    });
});

app.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, height, weight, birthdate, isMarried } = req.body;   
    const page = req.query.page || 1;
    
    // Ambil state filter lama dari string query URL agar setelah save data tidak hilang filternya
    const qName = req.query.name || '';
    const qHeight = req.query.height || '';
    const qWeight = req.query.weight || '';
    const qBirthdate = req.query.birthdate || '';
    const qIsMarried = req.query.isMarried || '';
    
    const query = 'UPDATE siswa SET name = ?, height = ?, weight = ?, birthdate = ?, ismarried = ? WHERE id = ?';
    const marriedValue = (isMarried === 'true' || isMarried === '1' || isMarried === true) ? 1 : 0;

    db.run(query, [name, height, weight, birthdate, marriedValue, id], (err) => {
        if (err) {
            return res.status(500).send("Failed to update data: " + err.message);
        }
        
        // redirect kembali dengan membawa parameter filter lengkap
        let redirectUrl = `/?page=${page}`;
        if (qName) redirectUrl += `&name=${encodeURIComponent(qName)}`;
        if (qHeight) redirectUrl += `&height=${encodeURIComponent(qHeight)}`;
        if (qWeight) redirectUrl += `&weight=${encodeURIComponent(qWeight)}`;
        if (qBirthdate) redirectUrl += `&birthdate=${encodeURIComponent(qBirthdate)}`;
        if (qIsMarried !== '') redirectUrl += `&isMarried=${encodeURIComponent(qIsMarried)}`;

        res.redirect(redirectUrl);
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
