import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const cfg = new DocumentBuilder().setTitle('Janmitra API').setVersion('0.1.0').build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(process.env.PORT || 4000);
  console.log(`API http://localhost:${process.env.PORT || 4000}`);
}
bootstrap();