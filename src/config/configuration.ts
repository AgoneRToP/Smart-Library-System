export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3000,
  mongo_url: process.env.MONGO_URL,
  jwt: {
    access_key: process.env.ACCESS_TOKEN_SECRET_KEY,
    access_time:
      parseInt(process.env.ACCESS_TOKEN_EXPIRE_TIME as string, 10) || 600,
    refresh_key: process.env.REFRESH_TOKEN_SECRET_KEY,
    refresh_time: process.env.REFRESH_TOKEN_EXPIRE_TIME,
  },
});
