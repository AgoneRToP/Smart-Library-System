# Smart Library Management System

## Project Overview

Develop a REST API for managing a digital library.

The system allows:

* User registration and activation
* Book management
* Borrowing and returning books
* Role-based access control
* Book cover uploads
* Email notifications
* Telegram bot integration
* Redis caching
* Docker deployment

⸻

## Business Requirements

### Roles

Admin

* Manage books
* Manage users
* View all borrow records

Member

* Register account
* Activate account via email
* Browse books
* Borrow books
* Return books

⸻

## Functional Requirements

Authentication

User Registration

User provides:

* Full Name
* Email
* Password

System should:

* Hash password
* Generate activation token
* Send activation email

⸻

### Login

Return:

{
  "accessToken": "jwt-token"
}

⸻

### User Module

Member

Can:

* View profile
* Update profile

Admin

Can:

* View all users
* Block user
* Delete user

⸻

### Book Module

Book fields:

{
  id: number;
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  availableCopies: number;
  coverImage: string;
}

Admin can:

* Create book
* Update book
* Delete book

Everyone can:

* View books

⸻

### Borrow Module

Member can:

Borrow Book

Rules:

* Book must exist
* Available copies > 0

Create record:

{
  userId: number;
  bookId: number;
  borrowedAt: Date;
}

Decrease available copies.

⸻

Return Book

Rules:

* Borrow record exists

Increase available copies.

⸻

### Database Design

Users

id
fullName
email
password
role
isActive
createdAt
updatedAt

⸻

Books

id
title
author
isbn
publishedYear
availableCopies
coverImage
createdAt
updatedAt

⸻

Borrows

id
userId
bookId
borrowedAt
returnedAt
createdAt
updatedAt

⸻

## Technical Requirements

TypeScript Features

Must use:

* Interface
* Enum
* Generic
* Utility Types
* Abstract Class
* Access Modifiers
* Getter/Setter

Example:

enum UserRole {
 ADMIN,
 MEMBER
}

⸻

NestJS Concepts

Controllers

Use:

* Route Parameters
* Query Parameters
* Request Body

⸻

Services

Business logic separated from controllers.

⸻

Modules

Create:

AuthModule
UsersModule
BooksModule
BorrowModule
MailModule
TelegramModule

⸻

Middleware

Create request logger middleware.

Log:

METHOD URL TIME

⸻

Exception Filters

Create custom exception:

BookNotAvailableException

⸻

Validation

Use:

* ValidationPipe
* class-validator

Example:

@IsEmail()
email: string;

⸻

Guards

Implement:

JwtAuthGuard
RolesGuard

⸻

Interceptors

Create:

ResponseTransformInterceptor

Output format:

{
  "success": true,
  "data": {}
}

⸻

File Upload

Upload book cover images.

Store inside:

/uploads/books

Use:

FileInterceptor

⸻

Email Module

Send:

Activation Email

Welcome to Smart Library
Please activate your account.

⸻

Telegram Bot

Commands:

/start
/books
/mybooks

⸻

Redis

Cache:

GET /books

TTL:

60 seconds

⸻

Swagger

Document all APIs.

Required:

@ApiTags()
@ApiOperation()
@ApiBearerAuth()

⸻

Docker

Create:

Dockerfile
docker-compose.yml

Services:

* app
* postgres
* redis

⸻

Bonus Features

* Pagination
* Search by title
* Sorting
* Book reservation

⸻

Project Duration

Day 1

Authentication + Users

Day 2

Books + Borrowing

Day 3

Uploads + Email + Telegram Bot

Day 4

Redis + Swagger + Docker + Testing

⸻

### Evaluation Criteria

| Task | Points |
|:-----|------:|
| Authentication | 15 |
| Frontend | 20 |
| Validation | 10 |
| Guards | 10 |
| File Upload | 10 |
| Email | 10 |
| Telegram Bot | 10 |
| Redis | 5 |
| Docker | 5 |
| Swagger | 5 |
| **Total** | **100** |