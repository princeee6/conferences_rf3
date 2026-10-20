import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';
import session from "express-session";
import bcrypt from "bcryptjs";

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

// const newRequest = Request.create({
//   userId: 1,
//   roomId: 2,
//   dateStart: "2027-04-10",
//   payment: "СБП"
// })
// console.log("Созданная заявка")
// console.log(newRequest)


// const users = db.prepare('SELECT * FROM users').all();
// console.log(users);

// const rooms = db.prepare('SELECT * FROM rooms').all();
// console.log(rooms);

// const requests = db.prepare('SELECT * FROM requests').all();
// console.log(requests);

// const reviews = db.prepare('SELECT * FROM reviews').all();
// console.log(reviews);


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;


app.set("view engine", "ejs");
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'conf2027-secret',
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge: 1000 * 60 * 60 * 2,
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const INACTIVITY_LIMIT = 20 * 60 * 1000
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();
    
    if (req.session.lastActivity && (now - req.session.lastActivity > INACTIVITY_LIMIT)) {
      return req.session.destroy(() => {
        res.redirect('/login')
      });
    }
    req.session.lastActivity = now;
  }
  next();
});


const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.redirect('/login')

const requireAdmin = (req, res, next) =>
  req.session.login === 'Conf2027' ? next() : res.redirect('/login')


///=============== auth
const RULES = [
  { field: 'login',    test: v => /^[A-Za-z0-9]{6,}$/.test(v),             msg: 'Логин: латиница+цифры, минимум 6 символов' },
  { field: 'password', test: v => v && v.length >= 8,                      msg: 'Пароль: минимум 8 символов' },
  { field: 'fio',      test: v => /^[А-Яа-яЁё\s]+$/.test(v),               msg: 'ФИО: только кириллица и пробелы' },
  { field: 'phone',    test: v => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v), msg: 'Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ' },
  { field: 'email',    test: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),    msg: 'Email: некорректный формат' }
];

const validate = data => RULES
  .filter(({ field, test }) => !test((data[field] || '').trim()))
  .map(r => r.msg);

//=login
app.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
  res.render('auth',{
    mode: 'login',
    error: null,
    flash
  })
});

app.post ('/login', (req, res)=> {
  const user = User.findByLogin(req.body.login);

  if(user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userId = user.id
    req.session.fio = user.fio
    req.session.login = user.login
    req.session.lastActivity = Date.now();

    return res.redirect(user.login === 'Conf2027' ? '/admin' : 'dashboard');
  }
  res.render('auth', {
    mode: 'login',
    error: 'Неверный логин или пароль',
    flash: null
  });
});
//=login

//==register
app.get("/register", (req, res) => {
  res.render("auth", {
    mode: 'register',
    errors: [],
    form: {}, 
  });
}); // Закрыли GET

app.post('/register', (req, res) => {
  const errors = validate(req.body);

  if (User.exists(req.body.login)){
    errors.push('Логин уже занят');
  }
  
  // Проверка на ошибки (length, а не lenght!)
  if (errors.length) { 
    return res.render('auth', {mode: 'register', form: req.body, errors });
  }

  // 🔥 ВАЖНО: Хешируем пароль перед сохранением, иначе потом не сможете войти
  const userData = { ...req.body };
  userData.password = bcrypt.hashSync(userData.password, 10);

  // Сохраняем пользователя
  User.create(userData);
  
  req.session.flash = {type: 'success', text :'Регистрация прошла успешно. Войдите.'}
  res.redirect('/login')
}); // <--- ВОТ ЗДЕСЬ ЗАКРЫВАЕТСЯ POST (вы забыли эту скобку)

//=logout
app.all('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});
///============== auth


app.get('/create', (req, res) => {
  const rooms = Room.findAll()
  res.render("create_request", { rooms, errors: [] });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
