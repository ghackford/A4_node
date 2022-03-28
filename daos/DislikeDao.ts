/**
 * @file Implements DAO managing the storage and usage of dislike objects in MongoDB
 */
import DislikeDaoI from "../interfaces/DislikeDaoI";
import DislikeModel from "../mongoose/dislikes/DislikeModel";
import Dislike from "../models/dislikes/Dislike";

/**
 * @class DislikeDao Implements Data Access Object managing data storage
 * of Dislikes
 * @property {DislikeDao} dislikeDao private instance of DislikeDao
 */
export default class DislikeDao implements DislikeDaoI {
    private static dislikeDao: DislikeDao | null = null;
    /**
     * Creates singleton DAO instance
     * @returns UserDao
     */
    public static getInstance = (): DislikeDao => {
        if(DislikeDao.dislikeDao === null) {
            DislikeDao.dislikeDao = new DislikeDao();
        }
        return DislikeDao.dislikeDao;
    }
    private constructor() {}
    /**
     * Gets a list of all the users that disliked a tuit
     * @param tid the ID of the tuit 
     * @returns an array of dislike objects
     */
    findAllUsersThatDislikedTuit = async (tid: string): Promise<Dislike[]> =>
        DislikeModel
            .find({tuit: tid})
            .populate("dislikedBy")
            .exec();
    /**
     * Gets a list of all tuits disliked by a single user
     * @param uid the ID of the user
     * @returns a list of dislike objects
     */
    findAllTuitsDislikedByUser = async (uid: string): Promise<Dislike[]> =>
        DislikeModel
            .find({dislikedBy: uid})
            .populate({
                path: "tuit",
                populate: {
                    path: "postedBy"
                }
            })
            .exec();
    /**
     * Instantiates a dislike between a user and a tuit
     * @param uid the ID of the user
     * @param tid the ID of the Tuit being disliked
     * @returns the dislike object
     */
    userDislikesTuit = async (uid: string, tid: string): Promise<any> =>
        DislikeModel.create({tuit: tid, dislikedBy: uid});

    /**
     * Get if the user has already disliked a tuit
     * @param uid the user's ID
     * @param tid the tuit's ID
     * @returns the dislike object
     */
    findUserDislikesTuit = async (uid: string, tid: string): Promise<any> =>
        DislikeModel.findOne({tuit: tid, dislikedBy: uid});
    
    /**
     * removes a dislike between a user and a tuit
     * @param uid the ID of the user
     * @param tid the ID of the Tuit
     * @returns the status of whether the deletion was successfuly
     */
    userUnDislikesTuit = async (uid: string, tid: string): Promise<any> =>
        DislikeModel.deleteOne({tuit: tid, dislikedBy: uid});
    
    /**
     * test function to count the number of dislikes a Tuit has
     * @param tid the ID of the tuit
     * @returns the number of dislikes the tuit has
     */
    countHowManyDislikedTuit = async (tid: string): Promise<any> =>
        DislikeModel.count({tuit: tid});
}