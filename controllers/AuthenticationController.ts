/**
 * @file Controller RESTful Web service API for authentication
 */
import {Request, Response, Express} from "express";
import UserDao from "../daos/UserDao";
const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Singleton controller instance for authentication
 * @param {Express} app Express instance to declare the RESTful Web service API
 * @property {UserDao} userDao instance of userDao implementing CRUD operations
 */
const AuthenticationController = (app: Express) => {
    const userDao: UserDao = UserDao.getInstance();

    /**
     * Login function takes a existing user and authenticates it
     * @param {Request} req Represents request from client, including user data
     * @param {Response} res Represents response to client, including resulting
     * status or existing, logged-in user
     */
    const login = async (req: Request, res: Response) => {
        const user = req.body;
        const username = user.username;
        const password = user.password;
        console.log(password)
        const existingUser = await userDao
            .findUserByUsername(username);
        console.log(existingUser);
        if (!existingUser) {
            res.sendStatus(404);
            return;
        }
        const match = await bcrypt.compare(password, existingUser.password);

        if (match) {
            existingUser.password = '*****';
            // @ts-ignore
            req.session['profile'] = existingUser;
            res.json(existingUser);
        } else {
            res.sendStatus(403);
        }
    }

    /**
     * Creates a new user with the specified information
     * @param {Request} req Represents request from client, including user data
     * @param {Response} res Represents response to client, including the
     * status of the operation if failed or the new user if successful
     */
    const register = async (req: Request, res: Response) => {
        const newUser = req.body;
        const password = newUser.password;
        const hash = await bcrypt.hash(password, saltRounds);
        newUser.password = hash;

        const existingUser = await userDao
            .findUserByUsername(req.body.username);
        if (existingUser) {
            res.sendStatus(403);
            return;
        } else {
            const insertedUser = await userDao
                .createUser(newUser);
            insertedUser.password = '';
            // @ts-ignore
            req.session['profile'] = insertedUser;
            res.json(insertedUser);
        }
    }

    /**
     * Retrieves the session profile for the user
     * @param {Request} req Represents request from client to view user profile
     * @param {Response} res Represents response to client, including the
     * status code if failed or the user profile if successful
     */
    const profile = (req: Request, res: Response) => {
        // @ts-ignore
        const profile = req.session['profile'];
        if (profile) {
            res.json(profile);
        } else {
            res.sendStatus(403);
        }
    }

    /**
     * 
     * @param {Request} req Represents request from client to logout
     * @param {Response} res Represents response to client, including the
     * status of the logout
     */
    const logout = (req: Request, res: Response) => {
        // @ts-ignore
        req.session.destroy();
        res.sendStatus(200);
    }

    /**
     * Defined HTTP endpoints include:
     * <ul>
     *  <li>POST /api/auth/login log in with an existing user</li>
     *  <li>POST /api/auth/register to register a new user</li>
     *  <li>POST /api/auth/profile to set the user profile information </li>
     *  <li>POST /api/auth/logout to log out with an existing user</li>
 * </ul>
     */
    app.post("/api/auth/login", login);
    app.post("/api/auth/register", register);
    app.post("/api/auth/profile", profile);
    app.post("/api/auth/logout", logout);
}

export default AuthenticationController;