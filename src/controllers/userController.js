const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const AuthorizationService = require('../services/authorizationService');
const userService = require('../services/userService');

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user_id  = req.user?.user_id;
        const userProfile = await UserService.getUserProfile(user_id);
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: {
                user: userProfile
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

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
        const { full_name, email, address, dob } = req.body;
        
        // Create update object, only including fields that have values
        const updateData = {};
        
        if (full_name && full_name.trim() !== '') {
            updateData.full_name = full_name;
        }
        
        if (email && email.trim() !== '') {
            updateData.email = email;
        }
        
        if (dob && dob.trim() !== '') {
            updateData.dob = dob;
        }

        if (address && address.trim() !== '') {
            updateData.address = address;
        }
        
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }
        
        const updatedUser = await UserService.updateUserInfo(user_id, updateData);
        
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
            await EmailService.sendVerificationEmail(email, otp_code)
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
const viewWonProduct = async (req,res)=>{
    try{
        const user_id = req.user?.user_id;
        const wonProducts = await UserService.viewWonProduct(user_id);
        if(!wonProducts){
            return res.json({
                success: true,
                message: "no won product"
            })
        }else{
            return res.status(200).json({
                success: true,
                message: "fetched won products",
                data: {
                    list: wonProducts
                }
            })
        }
    }catch(error){
        console.error("error fetching won producsts")
        return res.status(500).json({
            success: false,
            message: "Internal sever error"
        })
    }
}


const viewUserRatings = async (req, res)=>{
    //const userid = req.user?.user_id;
    //const r = userService.getAllRatings(userid);
    //console.log(r);
    try{
        const user_id = req.user?.user_id;
        const ratings = await userService.getAllRatings(user_id);
        console.log(user_id);
        console.log(ratings);
        return res.status(200).json({
            success: true,
            message: "fetch user ratings",
            data: {
                list: ratings
            }
        });
    }catch(error){
        console.error("error fetching ratings")
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })

    }
    
}

const viewReviewedRatings = async (req, res)=>{
    try{
        const user_id = req.user?.user_id;
        const ratings = await userService.getReviewedRatings(user_id);
        return res.status(200).json({
            success: true,
            message: "fetch reviewer ratings",
            data: {
                list: ratings
            }
        });
    }catch(error){
        console.error("error fetching ratings")
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

module.exports = {
    getUserProfile,
    changeEmail, 
    changeFullName, 
    changePassword, 
    updateUserInfo,
    forgetPasswordRequest, 
    viewBiddedProduct, 
    resetPassword, 
    viewWatchList,
    viewWonProduct,
    viewUserRatings,
    viewReviewedRatings
};   