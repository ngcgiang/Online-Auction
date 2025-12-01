const {QuestionAnswer } = require('../models');
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
            where: { product_id: productId }, // get top-level
            include: [
                {
                    model: QuestionAnswer,
                    as: 'replies',
                    include: [
                        {
                            model: QuestionAnswer,
                            as: 'replies'
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

}

module.exports = new qaService();