const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const AuthorizationService = require('../services/authorizationService');

const changeEmail = async (req, res) => {
    try {
        const user_id  = req.user?.user_id;
        console.log(user_id);
        const { newEmail } = req.body;
        const updatedUser = await UserService.changeUserEmail(user_id, newEmail);
        return res.status(200).json({
            success: true,
            message: 'Email updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Error updating email:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const changeFullName = async (req, res) => {
    try {
        const user_id  = req.user?.user_id;
        const { newFullName } = req.body;
        const updatedUser = await UserService.changeUserFullName(user_id, newFullName);
        return res.status(200).json({
            success: true,
            message: 'Full name updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Error updating full name:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const user_id  = req.user?.user_id;
        console.log(user_id);
        const { oldPassword,newPassword } = req.body;   
        if(!await UserService.checkPassword(user_id, oldPassword)){
            return res.status(400).json({
                success: false,
                message: 'Old password is incorrect'
            });
        }
        const updatedUser = await UserService.changeUserPassword(user_id, newPassword);
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateUserInfo = async (req, res) => {
    try {
        const user_id  = req.user?.user_id;
        const { full_name, email, dob } = req.body;
        const updatedUser = await UserService.updateUserInfo(user_id, { full_name, email, dob });
        return res.status(200).json({
            success: true,
            message: 'User info updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Error updating user info:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

const forgetPasswordRequest = async(req,res)=>{
    try{
        const {email} = req.body;
        console.log(email);
        
        if(await UserService.checkValidEmail(email)===false){
            return res.status(400).json({
                success: false,
                message: 'Email is not valid'
            });
        } else {
            const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
            await EmailService.sendEmail(email, otp_code)
            await AuthorizationService.saveOtp(otp_code, email)
            return res.status(200).json({
                success: true,
                message: 'OTP code sent successfully',
                data: {
                    email: email,
                    otpCode: otp_code
                }
            });
        }
    }catch(error){
        console.error('Error request OTP code');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

const viewBiddedProduct = async(req,res)=>{
    try{
        const user_id = req.user?.user_id;
        const list = await UserService.viewBiddedProduct(user_id);
        return res.status(200).json({
            success: true,
            message: 'View bidded product successfully',
            data: {
                list: list
            }
        });
    }catch(error){
        console.error('Error view bidded product');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

const viewWatchList = async(req,res)=>{
    try{
        const user_id = req.user?.user_id;
        const list = await UserService.viewWatchList(user_id);
        return res.status(200).json({
            success: true,
            message: 'View watch list successfully',
            data: {
                list: list
            }
        });
    }catch(error){
        console.error('Error view watch list');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

const resetPassword = async(req,res)=>{
    try{
        const {email, newPassword, otp_code} = req.body;
        console.log(email, newPassword, otp_code);
        if(await AuthorizationService.verifyOtpcode(otp_code, email)===false){
            return res.status(400).json({
                success: false,
                message: 'OTP code is not valid'
            });
        }else{
            await UserService.resetForgotPassword(email, newPassword);
            return res.status(200).json({
                success: true,
                message: 'Reset password successfully'
            });
        }
    }catch(error){
        console.error('Error reset password');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
}
}
module.exports = {
    changeEmail, changeFullName, changePassword, updateUserInfo,forgetPasswordRequest, viewBiddedProduct, resetPassword, viewWatchList 
};   