import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from "bcryptjs";

const hash = bcrypt.hashSync('demo', 10);
console.log(">>>", hash)

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

if (count === 0) {
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

if (count2 === 0) {
    const stmt = db.prepare(`
            INSERT INTO rooms (type, name, capacity)
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
    rating TEXT NOT NULL DEFAULT 'Завершенная',
    review TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
    `);
const reviewsCount = db.prepare("SELECT COUNT(*) AS c FROM reviews").get().c;

if (reviewsCount === 0) {
    const stmtReview = db.prepare(`INSERT INTO reviews (request_id, user_id, room_id,rating ,review)
            VALUES (?, ?, ?, ?, ?)
            `)
    stmtReview.run(1, 1, 1, "завершенная", "Все прошло супер");
    stmtReview.run(3, 1, 3, "завершенная", "Все было хорошо");
    stmtReview.run(2, 2, 2, "завершенная", "все прошло нормально, но можно было лучше");
    console.log("тестовые отзывы добавлены")
}

const joinRowsClean = db.prepare(`
    SELECT 
        requests.id,
        requests.date_start,
        requests.payment,
        requests.status,
        users.fio,
        rooms.name AS room_name,
        JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'rating', reviews.rating,
                'text', reviews.review,
                'date', reviews.created_at
            )
        ) AS reviews_list
    FROM requests
    JOIN users ON users.id = requests.user_id
    JOIN rooms ON rooms.id = requests.room_id
    LEFT JOIN reviews ON reviews.request_id = requests.id
    GROUP BY requests.id
`).all();
// users + rooms + requests
const JOINrequests = db.prepare(` 
    SELECT requests.*, 
        users.fio, 
        rooms.name
    FROM requests
    JOIN users ON users.id = requests.user_id
    JOIN rooms ON rooms.id = requests.room_id;
`).all();

// console.log('JOIN requests + users + rooms:');
// console.log(JOINrequests);

class UserModel {
    constructor() {
        this.table = "users";
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id)
    }
    findByLogin(login) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login)
    }
    findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
    }
    count() {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${this.table}`).get();
        return result.count;
    }
    exists(login) {
        const user = db.prepare(`SELECT 1 FROM ${this.table} WHERE login = ?`).get(login);
        return user !== undefined;
    }
    create({ login, password, fio, phone, email}) {
        const hash = bcrypt.hashSync(password, 10);
        const r = db.prepare(`
            INSERT INTO ${this.table} (login, password, fio, phone, email)
            VALUES (?, ?, ?, ?, ?)
            `).run(login, hash, fio, phone, email);
            return this.findById(r.lastInsertRowid);
    }
}


class RoomModel {
    constructor() {
        this.table = 'rooms'
    }
    findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all()
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id)
    }
    findByType(type) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE type = ?`).all(type);
    }
    count() {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${this.table}`).get();
        return result.count;
    }
}

class RequestModel {
    constructor() {
        this.table = 'requests';
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
    }
    findByUser(userId) {
        const Userid = `
            SELECT r.*, rm.name AS room_name
            FROM ${this.table} r
            JOIN rooms rm ON r.room_id = rm.id
            WHERE r.user_id = ?
        `;
        return db.prepare(Userid).all(userId);
    }
    findAllDetailed() {
        const detailed = `
            SELECT r.*, u.fio AS user_fio, rm.name AS room_name
            FROM ${this.table} r
            JOIN users u ON r.user_id = u.id
            JOIN rooms rm ON r.room_id = rm.id
        `;
        return db.prepare(detailed).all();
    }
    count() {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${this.table}`).get();
        return result.count;
    }
    updateStatus(id, status) {
        return db.prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`).run(status, id);
    }
        create({ userId, roomId, dateStart, payment}) {
        const r = db.prepare(`
            INSERT INTO ${this.table} (user_id, room_id, date_start, payment)
            VALUES (?, ?, ?, ?)
            `).run(userId, roomId, dateStart, payment);
        return this.findById(r.lastInsertRowid);
        }
}






export const Request = new RequestModel();
export const User = new UserModel();
export const Room = new RoomModel()
export default db;