import CourseCategory from "../../models/coursecategory.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";

const courseCategoryController = {
    getAll: async (_, res) => {
        try {

            const courses = await CourseCategory.find();
            return SuccessHandler(courses, 200, res, `Course categories retrieved!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },


};

export default courseCategoryController;


