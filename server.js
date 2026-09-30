import express from "express";
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({ externded: true }));

app.get("/", (req, res) => {
  res.send(`Конференция.РФ<br> <a href="/about">о нас</a><br> 
    <a href="/contact">контакты</a><br>
    <a href="/register">регистрация</a><br>
    <a href="/login">логин</a><br>
    <a href="/help">помощь</a><br>
    <a href="/rooms">список помещений</a><br>
    <a href="/dashboard">мои заявки</a></br>`);
});
app.get("/about", (req, res) => {
  res.render("about", {
    title: "О нас",
    description: "Мы предоставляем помещения для аренды в Челябинске",
  });
});
app.get("/contact", (req, res) => {
  res.send("контакты");
});
app.get("/help", (req, res) => {
  res.send("Помощь");
});
app.get("/rooms", (req, res) => {
  res.send("Список помещений");
});
app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Мои заявки",
    user: { fio: "Иванов Иван" },
    requests: [
      { room_name: "аудитория 1", status: "new" },
      { room_name: "коворкинг", status: "end" },
    ],
  });
});
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Вход в систему",
    errors: [],
  });
});
app.get("/register", (req, res) => {
  res.render("register", {
    title: "Регистрация на портале",
    errors: [],
  });
  // res.send(`
  //   <form method="POST" action="/register">
  //   <input name="login" placeholder="логин"><br>
  //   <input name="fio" placeholder="ФИО"><br>
  //   <input name="number" type="tel" placeholder="телефон"><br>
  //   <input name="email" type="email" placeholder="емайл"><br>
  //   <input name="password" type="password" placeholder="пароль"><br>
  //   <button>создать пользователя</button>
  //   </form>
  //   `);
});
app.post("/register", (req, res) => {
  res.send(`пользователь ${req.body.login} зарегистрирован<br>
    фио: ${req.body.fio}<br>
    номер: ${req.body.number}<br>
    емайл: ${req.body.email}<br>
    пароль: ${req.body.password}<br>
  `);
});
app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
