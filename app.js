const express = require ("express");
const { PrismaClient } = require ("@prisma/client");
const Joi = require("joi");
const NodeCache = require("node-cache");

const prisma = new PrismaClient();
const cache = new NodeCache();
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log("Метод", req.method, "і шлях", req.path, "запиту.", "URL:", req.url);
  next();
});

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});

//дивимося всіх користувачів
app.get("/users", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const users = await prisma.user.findMany();
    const usersSlice = users.slice(startIndex, endIndex);
    res.json(usersSlice);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//дивимось якогось окремого користувача
// app.get("/users/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const user = await prisma.user.findUnique({
//       where: {
//         id: parseInt(id)
//       },
//     });
//     if (user) {
//       res.json(user);
//     } else {
//       res.status(404).json({ message: "User not found"})
//     }
//   } catch (err) {
//     res.status(400).json({ error: err.massage });
//   }
// });

//дивимось якогось окремого користувача, перший запит з бази даних, всі наступні з кешу
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let user = cache.get(id);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });
      cache.set(id, user);
      console.log(`Користувача з номером ${id} отримано з бази даних`);
    } else {
      console.log(`Користувача з номером ${id} отримано з кешу`);
    }

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "Користувача не знайдений"})
    }
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//дивимось якогось окремого користувача, перший запит з бази даних, всі наступні з кешу
// app.get("/users/:id", async (req, res) => {
//   const { id } = req.params;
//   const cachedData = cache.get(id);

//   try {
//     if (!cachedData) {
//         const user = await prisma.user.findUnique({
//           where: { id: Number(id) },
//         });
//       if (user) {
//         cache.set(user.id, user, 60)

//         res.status(200).json(user);
//       } else {
//         res.status(404).json({ message: "Користувача не знайдений" });
//       }
//     } else {
//       res.status(200).json(cachedData);
//     }
//   } catch (err) {
//     res.status(400).json({ error: err.massage });
//   }
// });

//створюємо користувача
app.post("/users", async (req, res) => {
  const userData = req.body;
  const { value, error } = userSchema.validate(userData);
  if (error) {
    return res.status(400).json(`Error: ${error.message}`);
  }

  const { name, email } = value;

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

// if (require.main == module) {
//   app.listen(port, () => {
//     console.log(`Example app listening at http://localhost:${port}`);
//   })
// }

// module.exports = app; // Експортували наш додаток по новому
