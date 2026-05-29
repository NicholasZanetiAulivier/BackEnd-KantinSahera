const request = require('supertest');
const express = require('express');
const server = require("../src/core/server");
const config = require('../src/core/config')
const assert = require('assert');

const app = express();
server(app);

console.log(process.env.NODE_ENV)

describe("Basic user creation, login, and profile check", function () {
    const body = {
        username: "User1",
        email: "user1@gmail.com",
        password: "1234567123213890",
        confirm_password: "1234567123213890"
    }

    const agent = request(app);

    it('should return successful registration', function (done) {
        agent
            .post('/api/auth/user/register')
            .send(body)
            .expect(201)
            .end((err, res) => {
                if (err) return done(err);
                if (res) return done();
            });
    }
    )

    let token;
    it('should let the user login', function (done) {
        agent
            .post('/api/auth/user/login')
            .send({ email: body['email'], password: body['password'] })
            .expect(200)
            .expect((res) => { if (!res.body.token) throw new Error('Token doesnt exist'); else token = res.body.token })
            .end((err, res) => {
                if (err) return done(err);
                if (res) return done();
            })
    })

    it('should let the user see profile', function (done) {
        agent
            .get('/api/auth/user/profile')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .expect((res) => {
                if (!('user_id' in res.body)) throw new Error('User ID doesnt exist');
                if (!('username' in res.body)) throw new Error('Username doesnt exist');
                if (!('email' in res.body)) throw new Error('Email doesnt exist');
                if (!('profile_image_url' in res.body)) throw new Error('Profile Image Url doesnt exist');
                if (!('phone_no' in res.body)) throw new Error('Phone Number doesnt exist');
                if (!('verified' in res.body)) throw new Error('Verified doesnt exist');
            })
            .end((err, res) => {
                if (err) return done(err);
                if (res) return done();
            })
    })
}
);

setTimeout(() => process.exit(0), 60000);