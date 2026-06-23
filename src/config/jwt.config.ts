import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  access_key: process.env.ACCESS_TOKEN_SECRET_KEY,
  refresh_key: process.env.REFRESH_TOKEN_SECRET_KEY,
  access_time: parseInt(process.env.ACCESS_TOKEN_EXPIRE_TIME || '3600', 10),
  refresh_time: parseInt(process.env.REFRESH_TOKEN_EXPIRE_TIME || '2592000', 10),
}));
