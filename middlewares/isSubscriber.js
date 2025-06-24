import Subscription from "../models/subscription.js";
import ErrorHandler from "../utils/functions/ErrorHandler.js";

const isSubscriber = async (req, res, next) => {
    if (req.user.subscriptionId) {
        const subscriptionPlan = await Subscription.findById(req.user.subscriptionId);
        if(subscriptionPlan.status !== 'active' && subscriptionPlan.status !== 'past_due') {
            return ErrorHandler(`Unauthorized: You're subscription status is' ${subscriptionPlan.status}!`, 401, res);
        }
        next();
    } else {
        return ErrorHandler("Unauthorized: You are not a subscriber!", 401, res);
    }
};


export default isSubscriber;



/*


import Subscription from "../models/subscription.js";
import ErrorHandler from "../utils/functions/ErrorHandler.js";

const isSubscriber = async (req, res, next) => {
    if (req.user.subscriptionId) {
        const subscriptionPlan = await Subscription.findById(req.user.subscriptionId);
        if(subscriptionPlan.status === 'active' || subscriptionPlan.status === 'past_due') {
            
            next();
        }

        return ErrorHandler(`Unauthorized: You're subscription status is' ${subscriptionPlan.status}!`, 401, res);
    } else {
        return ErrorHandler("Unauthorized: You are not a subscriber!", 401, res);
    }
};


export default isSubscriber;


*/