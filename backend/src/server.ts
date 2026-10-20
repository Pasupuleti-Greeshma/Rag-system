import { app } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './migrations/migrate.js';

async function bootstrap() {
  try {
    // Run database migrations on startup
    await runMigrations();

    app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 SmartDocs AI Backend Server Running!`);
      console.log(`📡 Port: ${config.port}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`🤖 AI Provider: ${config.aiProvider}`);
      console.log(`Embedding Model: ${config.aiEmbeddingModel} (${config.aiEmbeddingDimension}d)`);
      console.log(`Generation Model: ${config.aiGenerationModel}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
