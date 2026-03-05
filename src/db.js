import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'bot.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sender TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Product analyses table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS product_analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        image_path TEXT,
        title TEXT,
        description TEXT,
        price_estimate TEXT,
        market_analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sessions table (for Baileys)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User operations
export async function getOrCreateUser(phoneNumber, name = null) {
  try {
    let user = await dbGet(
      'SELECT * FROM users WHERE phone_number = ?',
      [phoneNumber]
    );

    if (!user) {
      await dbRun(
        'INSERT INTO users (phone_number, name) VALUES (?, ?)',
        [phoneNumber, name || phoneNumber]
      );
      user = await dbGet(
        'SELECT * FROM users WHERE phone_number = ?',
        [phoneNumber]
      );
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

// Conversation operations
export async function saveMessage(userId, message, sender, messageType = 'text') {
  try {
    await dbRun(
      'INSERT INTO conversations (user_id, message, sender, message_type) VALUES (?, ?, ?, ?)',
      [userId, message, sender, messageType]
    );
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

export async function getConversationHistory(userId, limit = 50) {
  try {
    const messages = await dbAll(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return messages.reverse();
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}

// Product analysis operations
export async function saveProductAnalysis(userId, platform, imagePath, analysis) {
  try {
    await dbRun(
      `INSERT INTO product_analyses 
       (user_id, platform, image_path, title, description, price_estimate, market_analysis) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        platform,
        imagePath,
        analysis.title || null,
        analysis.description || null,
        analysis.price_estimate || null,
        analysis.market_analysis || null
      ]
    );
  } catch (error) {
    console.error('Error saving product analysis:', error);
    throw error;
  }
}

export async function getUserAnalyses(userId, limit = 10) {
  try {
    const analyses = await dbAll(
      'SELECT * FROM product_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return analyses;
  } catch (error) {
    console.error('Error getting user analyses:', error);
    throw error;
  }
}

// Session operations
export async function saveSession(sessionId, data) {
  try {
    const existingSession = await dbGet(
      'SELECT * FROM sessions WHERE session_id = ?',
      [sessionId]
    );

    if (existingSession) {
      await dbRun(
        'UPDATE sessions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?',
        [JSON.stringify(data), sessionId]
      );
    } else {
      await dbRun(
        'INSERT INTO sessions (session_id, data) VALUES (?, ?)',
        [sessionId, JSON.stringify(data)]
      );
    }
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function getSession(sessionId) {
  try {
    const session = await dbGet(
      'SELECT * FROM sessions WHERE session_id = ?',
      [sessionId]
    );
    return session ? JSON.parse(session.data) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

export default db;
