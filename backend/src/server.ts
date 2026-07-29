import app from './app';
import { config } from './config/environment';
import { connectDatabase } from './config/database';

const startServer = async () => {
  // Connect to Database
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`=================================`);
    console.log(` RallyNIM API is running!`);
    console.log(` Port: ${config.port}`);
    console.log(` Mode: ${config.nodeEnv}`);
    console.log(` Network: ${config.network}`);
    console.log(`=================================`);
  });

  // Handle termination signals gracefully
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server shut down complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
