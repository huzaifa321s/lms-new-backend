import moment from 'moment';
import Blog from '../../models/blog.js';
import Teacher from "../../models/teacher.js";
import Student from "../../models/student.js";
import Course from "../../models/course.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";

const dashboardController = {
    getCards: async (req, res) => {
        try {
            // Get total number of teachers
            const totalTeachers = await Teacher.countDocuments();
            const totalStudents = await Student.countDocuments();
            const totalCourses = await Course.countDocuments();
            const totalBlogs = await Blog.countDocuments();

            // Calculate the start date of last week
            const lastWeekStartDate = moment().subtract(1, 'weeks').startOf('week');


            // Get teachers registered last week
            const teachersRegisteredLastWeek = await Teacher.countDocuments({
                createdAt: { $gte: lastWeekStartDate.toDate() }
            });

            // Get students registered last week
            const studentsRegisteredLastWeek = await Student.countDocuments({
                createdAt: { $gte: lastWeekStartDate.toDate() }
            });

            return SuccessHandler({
                totalBlogs,
                totalTeachers,
                totalStudents,
                totalCourses,
                teachersRegisteredLastWeek,
                studentsRegisteredLastWeek
            }, 200, res, `Got cards!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getRegistrationsLastWeek: async (req, res) => {
        try {
            // Calculate the start date of last week
            const lastWeekStartDate = moment().subtract(1, 'weeks').startOf('week');

            // Get students registered last week
            const studentsRegisteredLastWeek = await Student.find({
                createdAt: { $gte: lastWeekStartDate.toDate() }
            });

            // Get teachers registered last week
            const teachersRegisteredLastWeek = await Teacher.find({
                createdAt: { $gte: lastWeekStartDate.toDate() }
            });

            return SuccessHandler({
                studentsRegisteredLastWeek,
                teachersRegisteredLastWeek
            }, 200, res, `Got registrations from last week!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    analyzeTopCourses: async (req, res) => {
        try {
            // Fetch all courses
            const courses = await Course.find();

            // Sort courses by creation date
            courses.sort((a, b) => a.createdAt - b.createdAt);

            // Iterate over courses to count the number of students enrolled
            const coursesWithEnrollmentCounts = await Promise.all(courses.map(async course => {
                const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
                return { course, enrollmentCount };
            }));

            // Sort courses by enrollment count
            coursesWithEnrollmentCounts.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

            // Return the top 10 courses
            const topCourses = coursesWithEnrollmentCounts.slice(0, 10);

            return SuccessHandler({
                topCourses
            }, 200, res, `Top 10 courses analyzed successfully!`);
        } catch (error) {
            console.error("Error analyzing top courses:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }


    // // Maybe consider later
    // monthlyActiveUsers: async (req, res) => {
    //     try {
    //         // Calculate the start date of the current month
    //         const startDate = moment().startOf('month');
    
    //         // Find users who logged in this month
    //         const monthlyActiveUsers = await User.countDocuments({
    //             lastLogin: { $gte: startDate.toDate() }
    //         });
    
    //         res.json({ monthlyActiveUsers });
    //     } catch (error) {
    //         console.error("Error fetching monthly active users:", error);
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
};

export default dashboardController;
