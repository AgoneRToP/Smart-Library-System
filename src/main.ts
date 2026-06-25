import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import {
  LoggingInterceptor,
  ResponseTransformInterceptor,
} from './common/interceptors';
import { DatabaseExceptionFilter, HttpExceptionFilter } from './common/filters';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import hbs from 'hbs';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    cookieParser(
      process.env.COOKIE_SECRET || 'my_cookie_secure_signing_secret_key',
    ),
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new DatabaseExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Smart Library Management System')
    .setDescription('The Smart Library REST API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useStaticAssets(resolve('.', 'uploads'), { prefix: '/uploads' });

  const viewsPath = join(process.cwd(), 'views');
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');

  const partialsPath = join(viewsPath, 'partials');

  if (fs.existsSync(partialsPath)) {
    const partialFiles = fs.readdirSync(partialsPath);

    partialFiles.forEach((file) => {
      if (file.endsWith('.hbs')) {
        const partialName = file.replace('.hbs', '');
        const fileContent = fs.readFileSync(join(partialsPath, file), 'utf-8');
        
        hbs.registerPartial(partialName, fileContent);
        console.log(`[HBS] 🔧 Ручная регистрация partial: "${partialName}" — УСПЕШНО`);
      }
    });
    console.log('[HBS] 🚀 Все найденные частичные шаблоны успешно внедрены в память!');
  } else {
    console.error(`[HBS] ❌ Ошибка: Директория не найдена по пути: ${partialsPath}`);
  }

  hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
bootstrap();
