import mongoose from "mongoose";
import Course from "../../models/course.js";
import Student from "../../models/student.js";
import EnrolledCourses from "../../models/enrolledcourses.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";
import TeacherWallet from "../../models/teacherwallet.js";

const courseController = {
    enrollCourse: async (req, res) => {
        const courseId = req.body.courseId;
        try {

            const course = await Course.findById(courseId);
            if (!course) return ErrorHandler('Course not found!', 404, res);

            const student = await Student.findById(req.user._id);
            if (student.remainingEnrollmentCount === 0) {
                return ErrorHandler('You have exceed the limnit of enrolling courses!', 404, res);
            }

            await EnrolledCourses.create({
                course: courseId,
                student: req.user._id
            });

            const teacherWallet = await TeacherWallet.findOne({
                teacher: course.instructor
            });

            if (!teacherWallet) {
                await TeacherWallet.create({
                    teacher: course.instructor,
                    points: 10
                });
            } else {
                const prevPoints = teacherWallet.points;
                teacherWallet.points = prevPoints + 10;
                await teacherWallet.save();
            }

            student.remainingEnrollmentCount -= 1;
            await student.save();

            return SuccessHandler({
                remainingEnrollmentCount: student.remainingEnrollmentCount
            }, 200, res, `You've enrolled to the course!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getEnrolledCourses: async (req, res) => {
        const { page, q } = req.query;

        const pageNumber = parseInt(page) || 1;
        const itemsPerPage = 10; // Set a default page size of 10
        const skip = (pageNumber - 1) * itemsPerPage;

        try {
            if (!req.user) return ErrorHandler('Unauthorized - Login first!', 400, res);

            // Find the enrolled courses for the user
            const enrolledCourseIds = await EnrolledCourses.find({
                student: req.user._id
            }).select('course');

            // Extract course IDs from the enrolled courses
            const courseIds = enrolledCourseIds.map(enrolled => enrolled.course);

            // Construct the query for searching courses
            let query = { _id: { $in: courseIds } };
            if (q) {
                query.name = { $regex: q, $options: "i" };
            }

            // Get the total count of matching courses for pagination
            const totalCourses = await Course.countDocuments(query);
            const totalPages = Math.ceil(totalCourses / itemsPerPage);

            // Apply the search query and pagination to the courses
            const courses = await Course.find(query)
                .select('name description coverImage')
                .skip(skip)
                .limit(itemsPerPage);

            // Prepare the response data
            const myEnrolledCourses = courses.map(course => ({
                _id: course._id,
                name: course.name,
                description: course.description,
                coverImage: course.coverImage,
            }));

            // Return the response with pagination info
            const response = {
                courses: myEnrolledCourses,
                totalPages
            };

            return SuccessHandler(response, 200, res, `Courses retrieved!`);
        } catch (error) {
            console.error("Error retrieving courses:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },


    getEnrolledCourseDetails: async (req, res) => {
        const id = req.params.id;
        try {
            if (!id) return ErrorHandler('Id is required!', 400, res);

            const course = await Course.findById(id)
                .populate({ path: "category", select: "name" })
                .populate({
                    path: "instructor",
                    select: "firstName lastName"
                })
                .exec();

            return SuccessHandler(course, 200, res, `Course with id: ${id}, retrieved!`);
        } catch (error) {
            console.error("Error:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }
}

export default courseController;