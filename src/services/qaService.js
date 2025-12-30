const {QuestionAnswer, User } = require('../models');
const sequelize = require('../config/db');

class qaService {
    async addComment(productId, userId, parentCommentId, content) {
        try{
            const newComment = await QuestionAnswer.create({
                product_id: productId,
                user_id: userId,
                parent_comment_id: parentCommentId,
                content: content
            });
            return newComment;
        } catch (error) {
            console.error("addComment error:", error);
            throw new Error('Failed to add comment');
        }
    }


 

    async getCommentsByProduct(productId) {
        try {
            const comments = await QuestionAnswer.findAll({
                where: { product_id: productId }, // Điều kiện lấy comment cha
                include: [
                    // 1. Lấy thông tin User cho comment cấp cao nhất (Cha)
                    {
                        model: User,
                        as: 'user', // Phải khớp với 'as' trong quan hệ belongsTo
                        attributes: ['full_name'] // Chỉ lấy các trường cần thiết
                    },
                    // 2. Lấy danh sách trả lời (Replies cấp 1)
                    {
                        model: QuestionAnswer,
                        as: 'replies',
                        include: [
                            // Lấy thông tin User cho reply cấp 1
                            {
                                model: User,
                                as: 'user',
                                attributes: ['full_name']
                            },
                            // Lấy danh sách trả lời lồng nhau (Replies cấp 2)
                            {
                                model: QuestionAnswer,
                                as: 'replies',
                                include: [
                                    // Lấy thông tin User cho reply cấp 2
                                    {
                                        model: User,
                                        as: 'user',
                                        attributes: ['full_name']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            return comments;
        } catch (error) {
            console.error("getCommentsByProduct error:", error);
            throw new Error('Failed to fetch comments');
        }
    }

    async getCommentEmail(commentID){
        try{
            const comment_id = await QuestionAnswer.findByPk(commentID);
            
            const sender_email = await User.findByPk(comment_id.user_id);
            return sender_email.email;
        }catch(error){
            console.error("getSenderEmail error:", error);
            throw new Error('Failed to fetch comment email');
        }
    }

    getUserEmailById(userId) {
        try{
            return User.findByPk(userId).then(user => user ? user.email : null);
        }catch(error){
            console.error("getUserEmailById error:", error);
            throw new Error('Failed to fetch user email by ID');
        }
    }
}

module.exports = new qaService();