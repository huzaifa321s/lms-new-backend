import mongoose from "mongoose";
import GameCategory from "../../models/gamecategory.js";
import TrainingWheelGame from "../../models/trainingwheelgame.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";

const gameCategoryController = {

    add: async (req, res) => {
        const { name } = req.body;
        try {
            if (!name) return ErrorHandler('Category name is required', 400, res);

            const gameCategories = await GameCategory.create({ name: name });
            return SuccessHandler(gameCategories, 200, res, `Game category created!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    edit: async (req, res) => {
        const id = req.params.id;
        const { name } = req.body;
        try {
            if (!id) return ErrorHandler('Id is required', 400, res);

            const gameCategory = await GameCategory.findById(id);
            if (!gameCategory) return ErrorHandler('Category does not exist', 400, res);

            if (name) gameCategory.name = name;
            await gameCategory.save();

            return SuccessHandler(gameCategory, 200, res, `Game category updated!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getAll: async (_, res) => {
        try {
            const allGameCategories = await GameCategory.find();
            return SuccessHandler(allGameCategories, 200, res, `Game categories retrieved!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },


    get: async (req, res) => {
        const { page, q } = req.query;

        const pageNumber = parseInt(page) || 1;
        const itemsPerPage = 6; // Set a default page size of 10
        const skip = (pageNumber - 1) * itemsPerPage;

        try {

            let query = {}
            if (q) {
                query = { name: { $regex: q, $options: "i" } }
            }

            const totalGameCategories = await GameCategory.countDocuments(query);
            const totalPages = Math.ceil(totalGameCategories / itemsPerPage);

            const gameCategories = await GameCategory.find(query).skip(skip).limit(itemsPerPage);
            return SuccessHandler({ gameCategories, totalPages }, 200, res, `Game categories retrieved!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },


    delete: async (req, res) => {
        const id = req.params.id; // This is presumably the category ID.
        const { deleteConfirmed } = req.body;

        try {
            if (!id) return ErrorHandler('Id is required', 400, res);

            const gameCategory = await GameCategory.findById(id);
            if (!gameCategory) return ErrorHandler('Category does not exist', 400, res);

            // Check if there are any blogs in this category
            const gameInCategory = await TrainingWheelGame.find({ category: id });

            if (gameInCategory.length > 0) {
                if (deleteConfirmed === "Yes") {
                    // If deletion is confirmed, delete all blogs in the category.
                    for (const blog of gameInCategory) {
                        await TrainingWheelGame.findByIdAndDelete(blog._id);
                    }
                    // After deleting blogs, delete the category.
                    await GameCategory.findByIdAndDelete(id);
                    return SuccessHandler(null, 200, res, `The category and all games with this category have been deleted.`);
                } else {
                    // If deleteConfirmed is not true, send a warning message.
                    return ErrorHandler('This category contains some games', 400, res);
                }
            } else {
                // If there are no blogs in the category, just delete the category.
                await GameCategory.findByIdAndDelete(id);
                return SuccessHandler(null, 200, res, `Category deleted successfully.`);
            }
        } catch (error) {
            console.error("Error in deletion:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }


};

export default gameCategoryController;


