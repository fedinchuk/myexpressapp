const expres = require ("express");

const app = expres();
const port = 3000;

app.use(expres.json());

let users = {};

//дивимося всіх користувачів
app.get("/users", (req, res) => {
  res.status(200).json({ users });
});

//дивимось якогось окремого користувача
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users[id];

  if (!user) {
    res.status(404).json({ error: "Користувача не існує" });
    return;
  }

  res.status(200).json({ user: users[id] });
});

//створюємо користувача
app.post("/users", (req, res) => {
  const { id, name, email } = req.body;

  if (users[id]) {
    res.status(409).json({ error: "User already exists" });
    return;
  }

  users[id] = { name, email };
  res.status(201).json({ user: users[id] });
});

//оновлюємо користувача
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const user = users[id];

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  users[id] = { name, email };
  res.status(200). json({ user: users[id] });
});

//видаляємо
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users[id];

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  delete users[id];
  res.status(200).json({ message: "User deleted successfully" })
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
