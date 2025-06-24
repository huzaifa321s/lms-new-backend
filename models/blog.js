import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogCategory',
        required: true,
    },
    
});



const Blog = mongoose.model('Blog', blogSchema);
export default Blog;