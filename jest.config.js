// jest.config.js

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // Load environment variables from .env file
  setupFilesAfterEnv: ['./jest.setup.js'], // Load setup file for Jest
  testTimeout: 30000, // Increase timeout if needed
};
