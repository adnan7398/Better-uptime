import axios from "axios";
import { describe, expect, it } from "bun:test";
import { BACKEND_URL } from "./config";

describe("signup endpoint", () => {
    it("isnt able to signup if body is incorrect", async () => {
        try {
            await axios.post(`${BACKEND_URL}/user/signup`, {
                password: "password"
            });
            expect(true, "control shouldnt reach here").toBe(false);
        } catch (e) {
            // expected: missing username rejected
        }
    });

    it("is able to signup if body is correct", async () => {
        const username = Math.random().toString();
        const res = await axios.post(`${BACKEND_URL}/user/signup`, {
            username,
            password: "randome password"
        });
        expect(res.status).toBe(200);
        expect(res.data.id).toBeDefined();
    });

    it("isnt able to signup twice with the same username", async () => {
        const username = Math.random().toString();
        await axios.post(`${BACKEND_URL}/user/signup`, {
            username,
            password: "password"
        });

        try {
            await axios.post(`${BACKEND_URL}/user/signup`, {
                username,
                password: "password"
            });
            expect(true, "control shouldnt reach here").toBe(false);
        } catch (e) {
            // expected: duplicate username rejected
        }
    });
});

describe("signin endpoint", () => {
    it("is able to signin with correct credentials", async () => {
        const username = Math.random().toString();
        const password = "password";
        await axios.post(`${BACKEND_URL}/user/signup`, { username, password });

        const res = await axios.post(`${BACKEND_URL}/user/signin`, { username, password });
        expect(res.status).toBe(200);
        expect(res.data.jwt).toBeDefined();
    });

    it("isnt able to signin with the wrong password", async () => {
        const username = Math.random().toString();
        await axios.post(`${BACKEND_URL}/user/signup`, { username, password: "correct-password" });

        try {
            await axios.post(`${BACKEND_URL}/user/signin`, { username, password: "wrong-password" });
            expect(true, "control shouldnt reach here").toBe(false);
        } catch (e) {
            // expected: wrong password rejected
        }
    });

    it("isnt able to signin with a username that doesnt exist", async () => {
        try {
            await axios.post(`${BACKEND_URL}/user/signin`, {
                username: Math.random().toString(),
                password: "password"
            });
            expect(true, "control shouldnt reach here").toBe(false);
        } catch (e) {
            // expected: unknown username rejected
        }
    });
});
