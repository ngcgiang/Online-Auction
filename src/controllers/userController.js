const UserService = require('../services/userService');

const registerUser = async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await UserService.createUser(userData);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                address: newUser.address,
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    registerUser
};