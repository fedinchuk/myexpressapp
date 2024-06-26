const express = require ("express");
const { PrismaClient } = require ("@prisma/client");
const Joi = require("joi");
const NodeCache = require("node-cache");
const bcrypt = require("bcrypt");
// const session = require("express-session");
const escapeHtml = require("escape-html");
const {authenticateToken, generateToken} = require("./security");

const prisma = new PrismaClient();
const cache = new NodeCache();
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log("Метод", req.method, "і шлях", req.path, "запиту.", "URL:", req.url);
  next();
});

// app.use(session({
//   secret: "your_secretkey_here",
//   resave: false,
//   saveUninitialized: true,
// }));

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/status", (req, res) => {
  res.status(200).send("Сервер працює");
});

// дивимося всіх користувачів
app.get("/users", authenticateToken, async (req, res) => {
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

// дивимось якогось окремого користувача
// app.get("/users/:id", authenticateToken, async (req, res) => {
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

// дивимось якогось окремого користувача, перший запит з бази даних, всі наступні з кешу
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

// дивимось якогось окремого користувача, перший запит з бази даних, всі наступні з кешу
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

// оновлюємо користувача
app.put("/users/:id", authenticateToken, async (req, res) => {
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

// видаляємо
app.delete("/users/:id", authenticateToken, async (req, res) => {
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

app.post("/register", async(req, res) => {
  const { name, password, email } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        hashedPassword,
        email,
      }
    })

    res.status(200).send("User was created");
  } catch (err) {
    res.status(500).send("Error while creating a user");
  }
});

app.post("/login", async(req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(401).send("No user found");
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isValid) {
      return res.status(401).send("Invalid password");
    }

    // req.session.username = user.name;
    // req.session.userId = user.id;
    token = generateToken(user);

    res.status(200).send({message: "Login successful", token: token});
  } catch (err) {
    res.status(500).send("Login error");
  }
});

app.get("/profilepp", async (req, res) => {
  if (req.session.username) {
    res.send(`Привіт, ${req.session.username}`);
  } else {
    res.send("Будь ласка, увійдіть");
  }
});

app.post("/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if(!user) {
      return res.status(401).send("Користувача не знайдено");
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).send("Неправильний старий пароль");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email: email },
      data: { hashedPassword: hashedPassword }
    });

    res.status(200).send("Пароль успішно змінено")
  } catch (err) {
    res.status(500).send("Помилка під час зміни пароля");
  }
});

app.post("/loginpp", async(req, res) => {
  const { name, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        name: name
      }
    });

    if (!user) {
      return res.status(401).send("Користувача не знайдено");
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isValid) {
      return res.status(401).send("Недійсний пароль");
    }

    req.session.username = user.name;
    req.session.userId = user.id;

    res.status(200).send("Вхід успішний");
  } catch (err) {
    res.status(500).send("Помилка входу");
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  if (req.user) {
    res.send(`Привіт, ${req.user.username}!`);
  } else {
    res.send("Будь ласка, увійдіть.");
  }
});


// перевірка автентифікації
// function isAuthenticated (req, res, next) {
//   if (req.session.user) next()
//   else next('route')
// }
// app.get('/', isAuthenticated, (req, res) => {
//   // це викликається лише тоді, коли є автентифікований користувач через isAuthenticated
//   res.send('Привіт, ' + escapeHtml(req.session.user) + '!' +
//     ' <a href="/logout">Вийти</a>')
// })

// app.get('/', (req, res) => {
//   res.send('<form action="/login" method="post">' +
//     'Ім`я користувача: <input name="user"><br>' +
//     'Пароль: <input name="pass" type="password"><br>' +
//     '<input type="submit" text="Login"></form>')
// })

// app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
//   // тут буде реалізовано логіку входу для перевірки req.body.user і req.body.pass.
//   // для цього прикладу працює будь-яке комбо

//   // повторно генерувати сеанс, що є хорошою практикою для захисту від форм фіксації сеансу
//   req.session.regenerate((err) => {
//     if (err) next(err)

//     // зберігати інформацію про користувача в сесії, як правило, ідентифікатор користувача
//     req.session.user = req.body.user

//     // зберегти сеанс перед перенаправленням, щоб гарантувати, що завантаження
//     // сторінки не відбудеться до того, як сеанс буде збережено
//     req.session.save((err) => {
//       if (err) return next(err)
//       res.redirect('/')
//     })
//   })
// })

// app.get('/logout', (req, res, next) => {
//   // логіка виходу

//   // видалити користувача з об’єкта сесії та зберегти.
//   // це гарантує, що повторне використання старого ідентифікатора
//   // сеансу не матиме зареєстрованого користувача
//   req.session.user = null
//   req.session.save((err) => {
//     if (err) next(err)

//     // повторно генерувати сеанс, що є хорошою практикою 
//     // для захисту від форм фіксації сеансу
//     req.session.regenerate((err) => {
//       if (err) next(err)
//       res.redirect('/')
//     })
//   })
// })


if (require.main == module) {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  })
}

module.exports = app; // eкспортували наш додаток по новому
