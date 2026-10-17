import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';

// import bcrypt from "bcryptjs";

import { Room } from "./db.js"
import { User } from "./db.js"
import { Request } from "./db.js";



// console.log("Все комнаты:", Room.findAll());
// console.log("Комната с id=2:", Room.findById(2));
// console.log("Все аудитории:", Room.findByType("аудитория"));
// console.log("Всего комнат:", Room.count());

// console.log("пользователь с id-1", User.findById(1))
// console.log("пользователь с логином anna", User.findByLogin("anna"))
// console.log("все пользователи", User.findAll())
// console.log("всего пользователей", User.count())
// console.log("есть ли пользователь anna?", User.exists("anna"))

// console.log("Заявка с id=1:", Request.findById(1));
// console.log("Заявки пользователя id=1(JOIN):", Request.findByUser(1));
// console.log("Все заявки (JOIN):", Request.findAllDetailed());
// console.log("Всего заявок:", Request.count());

// const hash = bcrypt.hashSync('demo', 10);
// console.log(">>>", hash)

const newRequest = Request.create({
  userId: 1,
  roomId: 2,
  dateStart: "2027-04-10",
  payment: "СБП"
})
console.log("Созданная заявка")
console.log(newRequest)

const newUser = User.create({
  login: 'test_user',
  password: 'test12345',
  fio: 'Тестов Тест',
  phone: '8(999)111-22-33',
  email: 'test@example.com'
});
console.log(newUser)

const users = db.prepare('SELECT * FROM users').all();
// console.log(users);

const rooms = db.prepare('SELECT * FROM rooms').all();
// console.log(rooms);

const requests = db.prepare('SELECT * FROM requests').all();
// console.log(requests);

const reviews = db.prepare('SELECT * FROM reviews').all();
// console.log(reviews);


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.static(join(__dirname, 'public')));

app.set("view engine", "ejs");
app.set('views', join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`Конференция.РФ<br> <a href="/about">о нас</a><br> 
    <a href="/contact">контакты</a><br>
    <a href="/register">регистрация</a><br>
    <a href="/login">логин</a><br>
    <a href="/help">помощь</a><br>
    <a href="/rooms">список помещений</a><br>
    <a href="/dashboard">мои заявки</a></br>
    <a href="/create">заявки</a></br>`);
});

app.get('/create', (req, res) => {
  const rooms = Room.findAll()
  res.render("create_request", { rooms, errors: [] });
});
app.get("/rooms", (req, res) => {
  res.send("Список помещений");
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

});
app.post("/register", (req, res) => {
  res.send(`пользователь ${req.body.login} зарегистрирован<br>
    фио: ${req.body.fio}<br>
    номер: ${req.body.number}<br>
    емайл: ${req.body.email}<br>
    пароль: ${req.body.password}<br>
    город: ${req.body.city}<br>
  `);
});

app.post('/register', (req, res) => {
  const errors = validate(req.body);

  if (User.exists(req.body.login)){
    errors.push('Логин уже занят');
  }

  if (errors.length) {
    return res.render('auth', {mode: 'register', form: req.body, errors });
  }

  User.create(req.body);

  req.session.flash = {type: 'success', text :'Регистрация прошла успешно. Войдите.'}
  res.redirect('/login')

})

app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
