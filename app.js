const express = require ("express");
const { PrismaClient } = require ("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

//дивимося всіх користувачів
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//дивимось якогось окремого користувача
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id)
      },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found"})
    }
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//створюємо користувача
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//оновлюємо користувача
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const user = await prisma.user.update({
      where: {
        id: parseInt(id)
      },
      data: { name, email },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//видаляємо
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: {
        id: parseInt(id)
      },
    });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
