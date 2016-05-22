[![Build Status](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware-simpleauth.svg?branch=master)](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware-simpleauth)

Simple authentication middleware for https://github.com/idchlife/node-telegram-bot-api-middleware

## So, what's the case for this middleware?

Imagine, that you have telegram bot. And you want it to become bot for you company, your friends and also somebody else.
So... You have some private data and just answering to commands for you is not enough. You want some kind of 'registration' of users in your system.
So, with this middleware you will get it! Beware, this is called `SIMPLEauth` for a reason. It uses sqlite3 and limited functionality.

As you know (if not yet, visit mentioned above repository **node-telegram-bot-api-middleware**), middleware is used to extend context of your next processed function callback for message/another middleware. This one does extend your list of middlewares with useful methods, properties for authentication and registration.

## Usage
For working example you can see examples/working-auth-bot.js
To test it you need to start it like this:

    node examples/working-auth-bot.js YOUR_BOT_TOKEN
    
### Here is some code with comments that will help you to start

```js
  // By default, simpleauth will create `simpleauth.sqlite3` file in your folder, 
  // for purpose of saving your authentication data. If you want to reset it,
  // just delete the file. You can also define your own filename. If you don't
  // want custom file, just omit passing arguments to .createMiddleware()
  const simpleauth = require('node-telegram-bot-api-simpleauth').createMiddleware({
    databaseFilename: 'YOUR_CUSTOM_DATABASE_FILE.sqlite3'
  });
  const use = require('node-telegram-bot-api-middleware');
  // When you use this middleware, your context will be populated with
  // object simpleauth. So you can use it via this.simpleauth
  const response = use(simpleauth);
  
  // Your configured bot
  const bot = require('./bot');
  
  bot.on('message', response(function* () {
    // You will have user, if user by chatId was already registered.
    // User object looks like this:
    // {
    //   id: number,
    //   firstName: string,
    //   lastName: string,
    //   chatId: number,
    //   username: string
    // }
    this.simpleauth.user
    
    // Method for checking if user authenticated
    this.simpleauth.isUserAuthenticated();
    
    // Method for checking if user is admin
    this.simpleauth.isCurrentUserAdmin();
    
    // Async method for making current user admin. Remember to use yield
    yield this.simpleauth.makeCurrentUserAdminAsync();
    
    // Async method for registering user who wrote the message with auth code
    yield this.simpleauth.registerCurrentTelegramUserWithCodeAsync(code);
    
    // Here start methods, that are from ./authentication.js
    // They are all async because they do work with database. Remember to use yield
    
    // Does auth code exist in database
    yield this.simpleauth.doesAuthCodeExist(code);
    
    // Did someone already use auth code for registration
    yield this.simpleauth.isAuthCodeAlreadyUsed(code);
    
    // Manually register user with your preferred arguments
    yield this.simpleauth.registerUser(username, firstName, lastName, chatId, code);
    
    // This one is important. Exactly it gives you new authentication/registration code,
    // so it can be passed to someone and used to register themselves in the system.
    // It's up to you how you use this method. In examples/working-auth-bot.js this used only by admin
    const code = yield this.simpleauth.generateAuthCode();
  });
```

## You can help with code, ideas and bugs by creating issues and pull requests.

Yes, this middleware may have some bugs and unexpected behaviour and you can help me to improve it!