const { User } = require('../models');
const bcrypt = require('bcrypt');


class UserService {
    async checkEmailExists(email){
        const user = await User.findOne({ where: { email } });
        return !!user;
    }

    async createUser(userData){
        const hasedPassword = await bcrypt.hash(userData.password, 10);
        if(!await this.checkEmailExists(userData.email)){
            const newUser = await User.create({
                username: userData.username,
                email: userData.email,
                full_name: userData.full_name,
                password: hasedPassword,
                address: userData.address
                //role: 'bidder'    
            });
            newUser.is_vẻrified = false;
            return newUser;
        } else{
            throw new Error('Email already in use');
        }
    }
}

module.exports = new UserService();