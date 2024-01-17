require('dotenv').config()

// this file serves the backend
const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json"); // <== Will be created later
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3200; // <== You can change the port

server.use(middlewares);
server.use(jsonServer.bodyParser);

let url;
if(process.env.NODE_ENV = 'production'){
  url = 'https://seahorse-app-xz5gx.ondigitalocean.app/'
} else {
  url = 'http://localhost:3200/'
}

server.post("/cards", (req, res) => {
  const db = router.db; // Access the database object
  // Handle the POST request here
  const customResponse = { id: db.get("nextId").value().id, ...req.body };
  db.update("nextId", (n) => {
    return { id: n.id + 1 };
  }).write();
  // Manually append the data to db.json
  db.get("cards").push(customResponse).write();
res.redirect(`${url}cards.html?id=${db.get("nextId").value().id - 1}`)
});

// forbidding all other request except GET and POST
server.all('*', function (req, res, next) {
  if (req.method === 'GET' || req.method === 'POST') {
    next() // Continue
  } else {
    res.sendStatus(403) // Forbidden
  }
})


server.get("/echo", (req, res) => {
  return res.send("<h1>hey</h1>");
});
server.use(router);
server.listen(port);

console.log("server running on port", port, '& mode', process.env.NODE_ENV );