const express = require ("express");
const { PrismaClient } = require ("@prisma/client");
const Joi = require("joi");

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log("Метод", req.method, "і шлях", req.path, "запиту.", "URL:", req.url);
  next();
});

const bookSchema = Joi.object({
  title: Joi.string().min(3).max(30).required(),
  author: Joi.string().min(3).max(30).required(),
});

//дивимося всі книги
app.get("/api/books", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const books = await prisma.book.findMany();
    const booksSlice = books.slice(startIndex, endIndex);
    res.json(booksSlice);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

//створення запису про нову кигу
app.post("/api/books", async (req, res) => {
  const bookData = req.body;
  const { value, error } = bookSchema.validate(bookData);
  if (error) {
    return res.status(400).json(`Error: ${error.message}`);
  }

  const { title, author } = value;

  try {
    const user = await prisma.book.create({
      data: { title, author },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.massage });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
