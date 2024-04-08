const expres = require ("express");
const sqlite3 = require ("sqlite3");

const app = expres();
const port = 3000;

app.use(expres.json());
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)");
});

//дивимося всіх користувачів
app.get("/users", (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  })
});

//дивимось якогось окремого користувача
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(row);
  });
});

//створюємо користувача
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

//оновлюємо користувача
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  db.run(`UPDATE users  SET name = ?, email = ? WHERE id = ?`, [name, email, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: `Row updated: ${this.changes}`});
  });
});

//видаляємо
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: `Row delete: ${this.changes}` });
  });
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
