import mongoose from "mongoose";
import Blog from "../../models/blog.js";
import BlogCategory from "../../models/blogcategory.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";
import { deleteFile } from "../../utils/functions/HelperFunctions.js";

const blogCategoryController = {

    add: async (req, res) => {
        const { name } = req.body;
        try {
            if (!name) return ErrorHandler('Category name is required', 400, res);

            const blogs = await BlogCategory.create({ name: name });
            return SuccessHandler(blogs, 200, res, `Blog category created!`);
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

            const blogCategory = await BlogCategory.findById(id);
            if (!blogCategory) return ErrorHandler('Category does not exist', 400, res);
            
            if(name) blogCategory.name = name;
            await blogCategory.save();

            return SuccessHandler(blogCategory, 200, res, `Blog category updated!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getAll: async (_, res) => {
        try {

            const blogs = await BlogCategory.find();
            return SuccessHandler(blogs, 200, res, `Blog categories retrieved!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },


    get: async (req, res) => {
        const {page, q} = req.query;

        const pageNumber = parseInt(page) || 1;
        const itemsPerPage = 6; // Set a default page size of 10
        const skip = (pageNumber - 1) * itemsPerPage;

        try {

            let query = {}
            if(q) {
                query = { name: { $regex: q, $options: "i" } }
            }

            const totalBlogCategories = await BlogCategory.countDocuments(query);
            const totalPages = Math.ceil(totalBlogCategories / itemsPerPage);

            const blogCategories = await BlogCategory.find(query).skip(skip).limit(itemsPerPage);
            return SuccessHandler({blogCategories, totalPages}, 200, res, `Blog categories retrieved!`);
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
    
            const blogCategory = await BlogCategory.findById(id);
            if (!blogCategory) return ErrorHandler('Category does not exist', 400, res);
    
            // Check if there are any blogs in this category
            const blogsInCategory = await Blog.find({ category: id });
    
            if (blogsInCategory.length > 0) {
                if (deleteConfirmed === "Yes") {
                    // If deletion is confirmed, delete all blogs in the category.
                    for (const blog of blogsInCategory) {
                        if (blog.image) {
                            // Assuming deleteFile is a function that deletes the file and returns true/false.
                            const deletedFile = deleteFile(blog.image, 'public/blog-images');
                            if (!deletedFile) console.log(`Deletion Error: 'Blog #${blog._id}, image deletion failed!'`);

                        }
                        await Blog.findByIdAndDelete(blog._id);
                    }
                    // After deleting blogs, delete the category.
                    await BlogCategory.findByIdAndDelete(id);
                    return SuccessHandler(null, 200, res, `The category and All blogs with this category have been deleted.`);
                } else {
                    // If deleteConfirmed is not true, send a warning message.
                    return ErrorHandler('This category contains some blogs', 400, res);
                }
            } else {
                // If there are no blogs in the category, just delete the category.
                await BlogCategory.findByIdAndDelete(id);
                return SuccessHandler(null, 200, res, `Category deleted successfully.`);
            }
        } catch (error) {
            console.error("Error in deletion:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }
    

};

export default blogCategoryController;


