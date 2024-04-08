const expres = require ("express");

const app = expres();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Welcome to my Express App!");
});

app.get("/contact", (req, res) => {
  res.send("Contact us at: contact@example.com");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
