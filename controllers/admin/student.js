import stripe from "stripe";
import mongoose from "mongoose";
import Student from "../../models/student.js";
import Subscription from "../../models/subscription.js";
import ErrorHandler from "../../utils/functions/ErrorHandler.js";
import SuccessHandler from "../../utils/functions/SuccessHandler.js";
import { getStudentActivePlan, planDetails } from "../../utils/functions/HelperFunctions.js";
import EnrolledCourses from "../../models/enrolledcourses.js";
import Course from "../../models/course.js";

const studentController = {

    get: async (req, res) => {
        const { page, q } = req.query;

        const pageNumber = parseInt(page) || 1;
        const itemsPerPage = 8; // Set a default page size of 8
        const skip = (pageNumber - 1) * itemsPerPage;

        try {
            let studentQuery = {};
            if (q) {
                let conditions = [];
                const searchTerms = q.split(" ");
                searchTerms.forEach(term => {
                    const condition = {
                        $or: [
                            { firstName: { $regex: term, $options: "i" } },
                            { lastName: { $regex: term, $options: "i" } }
                        ]
                    };
                    conditions.push(condition);
                });

                if (conditions.length !== 0) studentQuery = { $and: conditions };
            }

            const totalStudents = await Student.countDocuments(studentQuery);
            const totalPages = Math.ceil(totalStudents / itemsPerPage);

            let students = await Student.find(studentQuery).populate("subscriptionId").skip(skip).limit(itemsPerPage);
            
            students = students.map((s) => {
                const planActive = s.subscriptionId?.priceId && s.subscriptionId?.status === "active";
                const plan = planActive ? planDetails(s.subscriptionId.priceId) : null;
                return {
                    _id: s._id,
                    profile: s.profile,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    bio: s.bio,
                    phone: s.phone,
                    subscription: plan?.name,
                    email: s.email,
                    createdAt: s.createdAt
                }
            })
            return SuccessHandler({ students, totalPages }, 200, res, `Students retrieved!`);
        } catch (error) {
            console.error("Error retrieving:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getStudent: async (req, res) => {
        const id = req.params.id;
        try {
            if (!id) return ErrorHandler('Id is required!', 400, res);

            const student = await Student.findById(id);

            if (!student) return ErrorHandler('Student does not exist', 400, res);

            const activePlan = await getStudentActivePlan(student.subscriptionId);

            return SuccessHandler({ student, activePlan }, 200, res, `Student with id: ${id}, retrieved!`);
        } catch (error) {
            console.error("Error retrieving:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    },

    getEnrolledCourses: async (req, res) => {
        const { studentId, page, q } = req.query;

        const pageNumber = parseInt(page) || 1;
        const itemsPerPage = 4; // Set a default page size of 10
        const skip = (pageNumber - 1) * itemsPerPage;

        try {

            // Find the enrolled courses for the user
            const enrolledCourses = await EnrolledCourses.find({
                student: studentId
            }).select('course createdAt');

            // Extract course IDs from the enrolled courses
            const courseIds = enrolledCourses.map(enrolled => enrolled.course);

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
                .select('name description category instructor createdAt')
                .populate({path: 'category', select: 'name'})
                .populate({ path: "instructor",  select: "firstName lastName"})
                .skip(skip)
                .limit(itemsPerPage);

            // Prepare the response data
            const myEnrolledCourses = courses.map(course => ({
                _id: course._id,
                name: course.name,
                description: course.description,
                category: course.category.name,
                instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
                enrolledDate: enrolledCourses.find((ec) => {
                    if(ec.course.toString() === course._id.toString()) {
                        return ec
                    }
                })?.createdAt,
            }));

            return SuccessHandler({ courses: myEnrolledCourses, totalPages }, 200, res, `Enrolled courses retrieved!`);
        } catch (error) {
            console.error("Error retrieving courses:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }

};

export default studentController;