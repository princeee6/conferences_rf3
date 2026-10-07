import Database from "better-sqlite3";
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'conf.db'));
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    );
    `);

    const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

    if(count === 0) {
        const stmt = db.prepare(`
            INSERT INTO users (login, password, fio, phone, email)
            VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run('ivan', 'demo', 'Иванов Иван', '8(999)123-45-67', 'ivan@example.com');
            stmt.run('petr', 'demo', 'Петров Петр', '8(999)123-45-68', 'petr@example.com');
            stmt.run('anna', 'demo', 'Анна Сидорова', '8(999)123-45-69', 'anna@example.com');
            console.log('Тестовые пользователи добавлены');
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    );
    `);//type тип помещения capacity вместительность

    const count2 = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;

    if(count2 === 0) {
        const stmt = db.prepare(`
            INSERT INTO rooms (name, type, capacity)
            VALUES (?, ?, ?)
            `);
            stmt.run('аудитория', 'маленькое', 25);
            stmt.run('каворкинг', 'среднее', 50);
            stmt.run('кинозал', 'большое', 100);
            console.log('Тестовые помещения добавлены');
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Новая',
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
    `);
        const requestsCount = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;

        if (requestsCount === 0) {
            const stmtRequest = db.prepare(`INSERT INTO requests (user_id, room_id, date_start, payment)
            VALUES (?, ?, ?, ?)
            `)
            stmtRequest.run(1, 1, "2027-03-15", "при очном посещении");
            stmtRequest.run(1, 3, "2027-03-20", "перевод по СБП");
            stmtRequest.run(2, 2, "2027-04-01", "при очном посещении");
            console.log("тестовые заявки добавлены")
        }

    db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Завершенная',
    review TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
    `);
    const reviewsCount = db.prepare("SELECT COUNT(*) AS c FROM reviews").get().c;

        if (reviewsCount === 0) {
            const stmtReview = db.prepare(`INSERT INTO reviews (request_id, user_id, room_id,status,review)
            VALUES (?, ?, ?, ?, ?)
            `)
            stmtReview.run(1, 1, 1,"завершенная", "Все прошло супер");
            stmtReview.run(3, 1, 3,"завершенная", "Все было хорошо");
            stmtReview.run(2, 2, 2,"завершенная", "все прошло нормально, но можно было лучше");
            console.log("тестовые отзывы добавлены")
        }

// users + rooms + requests
const JOINrequests = db.prepare(` 
    SELECT requests.*, 
        users.fio, 
        rooms.name
    FROM requests
    JOIN users ON users.id = requests.user_id
    JOIN rooms ON rooms.id = requests.room_id;
`).all();

console.log('JOIN requests + users + rooms:');
console.log(JOINrequests);

// users + reviews
const JOINreviews = db.prepare(`
    SELECT
        reviews.id,
        reviews.review,
        reviews.status,
        users.fio AS user_fio,
        rooms.name AS room_name
    FROM reviews
    JOIN users ON users.id = reviews.user_id
    JOIN rooms ON rooms.id = reviews.room_id;
`).all();

console.log('JOIN reviews + users + rooms:');
console.log(JOINreviews);

// rooms + requests
const JOINrooms = db.prepare(`
    SELECT
        rooms.name,
        rooms.type,
        rooms.capacity,
        requests.date_start,
        requests.payment,
        requests.status
    FROM requests
    JOIN rooms ON rooms.id = requests.room_id;
`).all();

console.log('JOIN rooms + requests:');
console.log(JOINrooms);

//users + requests
const JOINusers = db.prepare(`
    SELECT
        users.fio,
        users.phone,
        users.email,
        requests.date_start,
        requests.payment,
        requests.status
    FROM requests
    JOIN users ON users.id = requests.user_id;
`).all();

console.log('JOIN users + requests:');
console.log(JOINusers);

    export default db;