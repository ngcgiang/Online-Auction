const UserService = require('../services/userService');

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

module.exports = {
    changeEmail, changeFullName, changePassword, updateUserInfo 
};