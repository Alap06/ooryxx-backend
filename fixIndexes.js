const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx-db';

const fixIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        console.log('Dropping indexes for Products...');
        try {
            await mongoose.connection.collection('products').dropIndexes();
            console.log('Products indexes dropped.');
        } catch (e) {
            console.log('Error dropping products indexes (might not exist):', e.message);
        }

        console.log('Dropping indexes for Orders...');
        try {
            await mongoose.connection.collection('orders').dropIndexes();
            console.log('Orders indexes dropped.');
        } catch (e) {
            console.log('Error dropping orders indexes (might not exist):', e.message);
        }

        console.log('Dropping indexes for Vendors...');
        try {
            await mongoose.connection.collection('vendors').dropIndexes();
            console.log('Vendors indexes dropped.');
        } catch (e) {
            console.log('Error dropping vendors indexes (might not exist):', e.message);
        }

        console.log('Done. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

fixIndexes();
