const app = require("../app");
const { PrismaClient } = require ("@prisma/client");
const request = require("supertest");

const prisma = new PrismaClient();

const users = [
  {email: "test1@e.com", name: "Test User 1"},
  {email: "test2@e.com", name: "Test User 2"},
  {email: "test3@e.com", name: "Test User 3"},
  {email: "test4@e.com", name: "Test User 4"},
];

describe("GET /users", () => {
  beforeAll(async () => {
    for(const user of users) {
      await prisma.user.create({
        data: user
      });
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  test("should respond with a list of users", async () => {
    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array); // Хочемо певірити що нам повертається масив
    expect(response.body.length).toBe(3); // Тобто ми створювали 4 користувачів 
  });

  test("should paginate the results", async () => {
    const response = await request(app).get("/users?page=2&limit=2");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("should handle invlaid page and limit parameters", async () => {
    const response = await request(app).get("/users?page=-1&limit=abc");
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  })
});
