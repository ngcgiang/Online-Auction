const qaService = require('../services/qaService');

const getQAbyProduct = async (req, res) => {
    try {
        const { product_id } = req.params;
        const comments = await qaService.getCommentsByProduct(product_id);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

const addComment = async (req, res) => {
    const { product_id, parent_comment_id, content } = req.body;
    const user_id = req.user?.user_id;
    //console.log(user_id);
    try {
        const newComment = await qaService.addComment( product_id, user_id, parent_comment_id, content);
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getQAbyProduct,
    addComment
};