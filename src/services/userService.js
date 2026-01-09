const { User, Bid , Product, Watchlist, Rating, Category } = require('../models');
const bcrypt = require('bcrypt');

class UserService {
    async getUserProfile(user_id) {
        try {
            const user = await User.findByPk(user_id, {
                attributes: { exclude: ['password'] }
            });
            return user;
        } catch (error) {
            console.error("getUserProfile error:", error);
            throw new Error('Failed to get user profile');
        }
    }

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
            
            // Sequelize's update() method only updates fields present in newInfo
            await user.update(newInfo);
            return user;
        }
        catch (error) {
            console.error("updateUserInfo error:", error);
            throw error; // Throw the original error to see what's wrong
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
    async updatePassword(email, password){
        try{
            const hasedPassword = await bcrypt.hash(password,10);
            const user = await User.findOne({where: {email}});
            if(!user){
                throw new Error('User not found');
            }
            user.password = hasedPassword;
            await user.save();
            return user;
        }catch(error){
            console.log("update password error:",error);
            throw new Error('Failed to update password');
        }  
    }

    async checkValidEmail(email){
        const user = await User.findOne({where:{email}});
        if(!user){
            return false;
        }
        return true;
    }

    async resetForgotPassword(email, newPassword){
        try{
            const user = await User.findOne({where: {email}});
            const hashedPassword = await bcrypt.hash(newPassword,10);
            user.password = hashedPassword;
            await user.save();
            return user;
        } catch(error){
            console.log("resetForgotPassword error:",error);
            throw new Error('Failed to reset password');
        }
    }

    async viewBiddedProduct(bidder_id) {
        try {
            const list = await Bid.findAll({
                where: { bidder_id },
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['product_id', 'product_name', 'current_price', 'end_time', 'buy_now_value', 'status', 'winner_id'],
                    where: { status: 'active' },
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['category_id', 'category_name']
                    }]
                }]
            });
            // Filter to only unique products by product_id
            const uniqueProducts = [];
            const seen = new Set();
            for (const bid of list) {
                if (bid.product && !seen.has(bid.product.product_id)) {
                    uniqueProducts.push(bid.product);
                    seen.add(bid.product.product_id);
                }
            }
            return uniqueProducts;
        } catch (error) {   
            console.log("viewBiddedProduct error:", error);
            throw new Error('Failed to view bidded product');
        }
    }
    async viewWatchList(user_id){
        try{
            const list = await Watchlist.findAll({
                where: {user_id},
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: [
                        'product_id', 'product_name', 'current_price', 'end_time', 'buy_now_value', 'status'
                    ],
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['category_id', 'category_name']
                    }]  
                }]
            });
            return list;
        }catch(error){
            console.log("viewWatchList error:", error);
            throw new Error('Failed to view watch list');
        }
    }
    
    async viewWonProduct(user_id) {
    try {
        const wonProducts = await Product.findAll({
            where: {
                winner_id: user_id,
                status: 'sold'        
            },
            include: [
                {
                    model: User,
                    as: 'seller',
                    attributes: ['user_id', 'full_name', 'email']
                }
            ],include: [{
                model: Category,
                as: 'category',
                attributes: ['category_id', 'category_name']
            }],
            order: [['end_time', 'DESC']] 
        });
        
        return wonProducts;
        } catch (error) {
            console.error("viewWonProduct error:", error);
            throw new Error('Failed to view won products');
        }
    }

    async getAllRatings(user_id){
        try{
            const ratings = await Rating.findAll({
                where:{
                    user_id : user_id
                }
            });
            return ratings;
        }catch(error){
            console.error("getAllRatings error:",error);
            throw new Error('failed to get all ratings');
        }
    }

    async getReviewedRatings(user_id){
        try{
            const ratings = await Rating.findAll({
                where:{
                    reviewer_id : user_id
                }
            });
            return ratings;
        }catch(error){
            console.error("getReviewedRatings error:",error);
            throw new Error('failed to get reviewed ratings');
        }
    }
  
}
module.exports = new UserService();