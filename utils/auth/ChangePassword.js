import { saveFile, deleteFile } from "../functions/HelperFunctions.js";
import ErrorHandler from "../functions/ErrorHandler.js";
import SuccessHandler from "../functions/SuccessHandler.js";

class ChangePassword {
    userType = "<User Type>";

    constructor(userModel) {
        this.userModel = userModel;
    }

    async change(req, res) {
        let reqBody = req.body;
        const user = req.user;

        try {

            const validationErrorMessage = this.validateFields(reqBody);
            if (validationErrorMessage) return ErrorHandler(validationErrorMessage, 400, res);

            const userExist = await this.checkExistingUser(user);
            if (!userExist) return ErrorHandler(`No ${this.userType} found with this email`, 404, res);
            const passwordUpdated = await this.validateAndUpdatePassword(userExist, reqBody);
            if (!passwordUpdated) return ErrorHandler(`Password does not match!`, 401, res);

            return SuccessHandler(null, 200, res, `${this.userType} password updated sucacessfully!`);
        } catch (error) {
            console.error("Error updating profile details:", error);
            return ErrorHandler('Internal server error', 500, res);
        }
    }


    validateFields(fields) {
        const requiredFields = ['password', 'newPassword'];
        const missingFields = requiredFields.filter(f => !fields[f]);

        let errorMessage = "";
        if (missingFields.length > 0) {
            errorMessage = `Please provide required fields: ${missingFields.join(', ')}.`;
            return errorMessage;
        }

        return null;
    }

    async checkExistingUser(user) {
        const userId = user._id;
        return await this.userModel.findById(userId);
    }

    async validateAndUpdatePassword(user, reqBody) {
        const { password, newPassword } = reqBody;
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return false;

        user.password = newPassword;
        await user.save();

        return true
    }
}

export default ChangePassword;
