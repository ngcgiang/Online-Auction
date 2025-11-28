const { User } = require('../models');
const bcrypt = require('bcrypt');


class AuthorizationService {
    async checkEmailExists(email){
        const user = await User.findOne({ where: { email } });
        return !!user;
    }

    async createUser(userData){
        const hasedPassword = await bcrypt.hash(userData.password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
        if(!await this.checkEmailExists(userData.email)){
            const newUser = await User.create({
                email: userData.email,
                full_name: userData.full_name,
                password: hasedPassword,
                address: userData.address,
                otp_code: otpCode,
                otp_expiry: otp_expiry
                //role: 'bidder'    
            });
            newUser.is_verified = false;
            return newUser;
        } else{
            throw new Error('Email already in use');
        }
    }

    async verifyUser(email, otpCode) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.otp_code !== otpCode) {
            throw new Error('Invalid OTP code');
        }

        if (new Date() > user.otp_expiry) {
            throw new Error('OTP code has expired');
        }

        user.is_verified = true;
        await user.save();

        return user;
    }

    async updateOtpCode(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp_code = newOtpCode;
        user.otp_expiry = otp_expiry;
        await user.save();
        return newOtpCode;
    }
}

module.exports = new AuthorizationService();