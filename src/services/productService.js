// const product = require('../models/Product');
// const bid = require('../models/Bid');
// const sequelize = require('../config/db');
const { Bid, Product, sequelize } = require('../models/index');

//5 san pham co gia tri hien tai cao nhat
const getTopValueProducts = async () =>{
    try{
        const products = await Productroduct.findAll({
            order: [['current_price', 'DESC']],
            limit: 5
    } );
    return products;
    } catch (error){
        console.error('Error fetching top value products:', error);
        throw error;
    }
}

const getTopLeastTimeLeftProducts = async () =>{
    try{
        const products = await Product.findAll({
            order: [['end_time', 'ASC']],
            limit: 5
    } );
    return products;
    } catch (error){
        console.error('Error fetching top least time left products:', error);
        throw error;
    } 
}  

const getTopMostBiddedProducts = async () => {
    try {
        const products = await Product.findAll({
            attributes:[
                'product_id', 
                'product_name', 
                'current_price', 
                'end_time',
                [sequelize.fn('COUNT', sequelize.col('bids.bid_id')), 'bidCount']
            ],
            include: [{
                model: Bid,
                as: 'bids',  
                attributes: [],
                duplicating: false  
            }],
            group: ['Product.product_id', 'Product.product_name', 'Product.current_price', 'Product.end_time'],  // Include all selected attributes
            order: [[sequelize.literal('bidCount'), 'DESC']],
            limit: 5,
            subQuery: false  // Add this for better performance with grouping
        });
        return products;
    } catch (error) {
        console.error('Error fetching top most bidded products:', error);
        throw error;
    }
}

const getProductById = async (product_id) =>{
    try{
        const product = await Product.findByPk(product_id);
        return product;
    } catch (error){
        console.error('Error fetching product by ID:', error);
        throw error;
    }
}


module.exports = {
    getTopValueProducts,
    getTopLeastTimeLeftProducts,
    getTopMostBiddedProducts,
    getProductById
};