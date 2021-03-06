/**
 * @file Controller RESTful Web service API for dislikes resource
 */
 import {Express, Request, Response} from "express";
 import DislikeDao from "../daos/DislikeDao";
 import DislikeControllerI from "../interfaces/DislikeControllerI";
 import TuitDao from "../daos/TuitDao";
 
 /**
  * @class TuitController Implements RESTful Web service API for dislikes resource.
  * Defines the following HTTP endpoints:
  * <ul>
  *     <li>GET /api/users/:uid/dislikes to retrieve all the tuits disliked by a user
  *     </li>
  *     <li>GET /api/tuits/:tid/dislikes to retrieve all users that disliked a tuit
  *     </li>
  *     <li>PUT /api/users/:uid/dislikes/:tid to record that a user dislikes a tuit
  *     </li>
  * </ul>
  * @property {DislikeDao} dislikeDao Singleton DAO implementing dislikes CRUD operations
  * @property {DislikeController} DislikeController Singleton controller implementing
  * RESTful Web service API
  */
 export default class DislikeController implements DislikeControllerI {
     private static dislikeDao: DislikeDao = DislikeDao.getInstance();
     private static tuitDao: TuitDao = TuitDao.getInstance();
     private static dislikeController: DislikeController | null = null;
     /**
      * Creates singleton controller instance
      * @param {Express} app Express instance to declare the RESTful Web service
      * API
      * @return TuitController
      */
     public static getInstance = (app: Express): DislikeController => {
         if(DislikeController.dislikeController === null) {
             DislikeController.dislikeController = new DislikeController();
             app.get("/api/users/:uid/dislikes", DislikeController.dislikeController.findAllTuitsDislikedByUser);
             app.get("/api/tuits/:tid/dislikes", DislikeController.dislikeController.findAllUsersThatDislikedTuit);
             app.put("/api/users/:uid/dislikes/:tid", DislikeController.dislikeController.userTogglesTuitDislikes);

             //test functions
             app.get("/api/tuits/:tid/dislikes/count", DislikeController.dislikeController.countDislikesOnTuit);
             app.delete("/api/tuits/dislikes/:did/delete", DislikeController.dislikeController.deleteDislike);
             app.get("/api/dislikes/:did", DislikeController.dislikeController.findDislikeById);
         }
         return DislikeController.dislikeController;
     }
 
     private constructor() {}

     /**
      * Retrieves all users that disliked a tuit from the database
      * @param {Request} req Represents request from client, including the path
      * parameter tid representing the disliked tuit
      * @param {Response} res Represents response to client, including the
      * body formatted as JSON arrays containing the user objects
      */
     findAllUsersThatDislikedTuit = (req: Request, res: Response) => {
         DislikeController.dislikeDao.findAllUsersThatDislikedTuit(req.params.tid)
             .then(dislikes => res.json(dislikes));
     }
     /**
      * Retrieves all tuits disliked by a user from the database
      * @param {Request} req Represents request from client, including the path
      * parameter uid representing the user disliked the tuits
      * @param {Response} res Represents response to client, including the
      * body formatted as JSON arrays containing the tuit objects that were disliked
      */
     findAllTuitsDislikedByUser = (req: Request, res: Response) => {
         const uid = req.params.uid;
         // @ts-ignore
         const profile = req.session['profile'];
         const userId = uid === "me" && profile ?
             profile._id : uid;
 
         DislikeController.dislikeDao.findAllTuitsDislikedByUser(userId)
             .then(dislikes => {
                 const dislikesNonNullTuits = dislikes.filter(dislike => dislike.tuit);
                 const tuitsFromDislikes = dislikesNonNullTuits.map(dislike => dislike.tuit);
                 res.json(tuitsFromDislikes);
             });
     }

     /**
      * Test function to retrieve the number of dislikes on a tuit
      * @param {Request} req Represents request from client, including the ID of the tuit
      * @param {Response} res Represents response to client, including the numerical value
      * of how many dislikes that tuit has
      */
     countDislikesOnTuit = (req: Request, res: Response) => {
        DislikeController.dislikeDao.countHowManyDislikedTuit(req.params.tid)
            .then(count => res.json(count));
     }
 
     /**
      * Test function to directly delete a dislike object from the database
      * @param {Request} req Represents request from client, including the ID of
      * the dislike object
      * @param {Response} res Represents response to client, including the status
      * of the deletion operation
      */
     deleteDislike = (req: Request, res: Response) => {
         DislikeController.dislikeDao.deleteDislike(req.params.did)
            .then(status => res.send(status));
     }

     /**
      * Test function to retrieve a dislike object directly
      * @param {Request} req Represents request from client, including the ID
      * of the dislike object
      * @param {Response} res Represents response to client, including the JSON
      * formatted dislike object
      */
     findDislikeById  = (req: Request, res: Response) => {
        DislikeController.dislikeDao.findDislikeById(req.params.did)
            .then(dislike => res.json(dislike));
     }
     
     /**
      * 
      * @param {Request} req Represents request from client, including the
      * path parameters uid and tid representing the user that is toggling their dislike
      * and the tuit being disliked/undisliked
      * @param {Response} res Represents response to client, a status code indicating the
      * success of the operation
      */
     userTogglesTuitDislikes = async (req: Request, res: Response) => {
         const dislikeDao = DislikeController.dislikeDao;
         const tuitDao = DislikeController.tuitDao;
         const uid = req.params.uid;
         const tid = req.params.tid;
         // @ts-ignore
         const profile = req.session['profile'];
         const userId = uid === "me" && profile ?
             profile._id : uid;
         try {
             const userAlreadyDislikedTuit = await dislikeDao.findUserDislikesTuit(userId, tid);
             const howManyDislikedTuit = await dislikeDao.countHowManyDislikedTuit(tid);
             let tuit = await tuitDao.findTuitById(tid);
             if (userAlreadyDislikedTuit) {
                 await dislikeDao.userUnDislikesTuit(userId, tid);
                 tuit.stats.dislikes = howManyDislikedTuit - 1;
             } else {
                 await DislikeController.dislikeDao.userDislikesTuit(userId, tid);
                 tuit.stats.dislikes = howManyDislikedTuit + 1;
             };
             await tuitDao.updateDislikes(tid, tuit.stats);
             res.sendStatus(200);
         } catch (e) {
             res.sendStatus(404);
         }
     }
 };