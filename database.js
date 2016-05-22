'use strict';

const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird');
const co = require('co');

Promise.promisifyAll(sqlite3);

const createUsersTabe = 'CREATE TABLE IF NOT EXISTS users (id integer primary key, admin integer default 0, telegram_chat_id integer, first_name text, last_name text, username text, auth_code_id integer, FOREIGN KEY(auth_code_id) references auth_codes(id));';
const createAuthCodesTable = 'CREATE TABLE IF NOT EXISTS auth_codes (id integer primary key, code text);';

exports.getDatabase = function* (filename) {
  filename = filename || 'simpleauth.sqlite3';

  const db = new sqlite3.Database(filename);

  yield db.runAsync(createUsersTabe);
  yield db.runAsync(createAuthCodesTable);

  return db;
};