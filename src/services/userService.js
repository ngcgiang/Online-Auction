const { User } = require('../models');
const bcrypt = require('bcrypt');

class UserService {
    async changeUserEmail(user_id, newEmail) {
        try {
            const user = await User.findByPk(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            user.email = newEmail;
            await user.save();
            return user;
        } catch (error) {
            console.error("changeUserEmail error:", error);
            throw new Error('Failed to change user email');

        }
    }

    async changeUserFullName(user_id, newFullName) {
        try {
            const user = await User.findByPk(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            user.full_name = newFullName;
            await user.save();
            return user;
        } catch (error) {
            console.error("changeUserFullName error:", error);
            throw new Error('Failed to change user full name');
        }
    }

    async changeUserPassword(user_id, newPassword) {
    try {
        const user = await User.findByPk(user_id);
        if (!user) {
            throw new Error('User not found');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;

        await user.save();
        return user;

    } catch (error) {
        console.error("changeUserPassword error:", error);
        throw new Error('Failed to change user password');
    }
}
    async updateUserInfo(user_id, newInfo){
        try{
            const user = await User.findByPk(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            user.full_name = newInfo.full_name;
            user.email = newInfo.email;
            user.dob = newInfo.dob;
            await user.save();
            return user;
        }
        catch (error) {
            console.error("updateUserInfo error:", error);
            throw new Error('Failed to update user info');
        }
    }


    async checkPassword(user_id, password) {
    try {
        const user = await User.findByPk(user_id);
        console.log(user);
        if (!user) {
            throw new Error('User not found');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Incorrect password');
        }
        return true;
    } catch (error) {
        console.error("checkPassword error:", error);
        throw new Error('Failed to check password');
    }
}

  
}
module.exports = new UserService();