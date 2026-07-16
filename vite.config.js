export default {
  server: {
    proxy: {
      "/cards": "http://localhost:3000"
    }
  }
};
