const UserController = require("../app/controllers/UserController");

function route(app) {
  app.post("/api/auth/register", UserController.register);
  app.post("/api/user/saveHistory/:email", UserController.addHistoryByEmail);
  app.get("/api/user/ranking", UserController.getRanking);
  app.get("/api/user/download", UserController.exportFileXlsx);
}

module.exports = route;