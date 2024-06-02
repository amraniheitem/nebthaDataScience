const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

const connectDb = async () => {
    try {
        await mongoose.connect('mongodb+srv://biofyta:biofyta123@biofyta.41qugja.mongodb.net/?retryWrites=true&w=majority&appName=biofyta', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected successfully to the database.');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
};

const getProfiles = async () => {
    try {
        const db = mongoose.connection.db;
        const profiles = await db.collection('profiles').find({}).toArray();
        console.log('Profiles retrieved from DB!');
        return profiles;
    } catch (error) {
        console.error('Error fetching profiles data:', error);
        return [];
    }
};

const getOrders = async () => {
    try {
        const db = mongoose.connection.db;
        const orders = await db.collection('orders').find({}).toArray();
        console.log('Orders retrieved from DB!');
        return orders;
    } catch (error) {
        console.error('Error fetching orders data:', error);
        return [];
    }
};

const getProductNames = async (productIds) => {
    try {
        const db = mongoose.connection.db;
        const products = await db.collection('products').find({ _id: { $in: productIds } }).toArray();
        const productNames = {};
        products.forEach(product => {
            productNames[product._id.toString()] = product.name;
        });
        return productNames;
    } catch (error) {
        console.error('Error fetching product names:', error);
        return {};
    }
};

const startServer = async () => {
    await connectDb();

    const analyse_maladie = async (req, res) => {
        const profiles = await getProfiles();

        if (profiles.length === 0) {
            return res.status(404).send('No profiles found');
        }

        const pythonProcess = spawn('python', ['analyse.py', 'maladie']);

        pythonProcess.stdin.write(JSON.stringify(profiles));
        pythonProcess.stdin.end();

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).send('Error executing Python script');
            }
            try {
                const maladiesParNom = JSON.parse(output);
                res.send(maladiesParNom);
            } catch (e) {
                console.error('Error parsing Python script output:', e);
                res.status(500).send('Error parsing Python script output');
            }
        });
    };

    const analyse_wilaya = async (req, res) => {
        const orders = await getOrders();

        if (orders.length === 0) {
            return res.status(404).send('No orders found');
        }

        const pythonProcess = spawn('python', ['analyse.py', 'wilaya']);

        pythonProcess.stdin.write(JSON.stringify(orders));
        pythonProcess.stdin.end();

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).send('Error executing Python script');
            }
            try {
                const wilayaOccurrences = JSON.parse(output);
                res.send(wilayaOccurrences);
            } catch (e) {
                console.error('Error parsing Python script output:', e);
                res.status(500).send('Error parsing Python script output');
            }
        });
    };

    const analyse_product = async (req, res) => {
        const orders = await getOrders();

        if (orders.length === 0) {
            return res.status(404).send('No orders found');
        }

        const pythonProcess = spawn('python', ['analyse.py', 'product']);

        pythonProcess.stdin.write(JSON.stringify(orders));
        pythonProcess.stdin.end();

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                return res.status(500).send('Error executing Python script');
            }
            try {
                const productOccurrences = JSON.parse(output);
                const productIds = Object.keys(productOccurrences).map(id => new mongoose.Types.ObjectId(id));
                const productNames = await getProductNames(productIds);
                const result = {};
                Object.keys(productOccurrences).forEach(id => {
                    result[productNames[id] || id] = productOccurrences[id];
                });
                res.send(result);
            } catch (e) {
                console.error('Error parsing Python script output:', e);
                res.status(500).send('Error parsing Python script output');
            }
        });
    };

    app.get('/analyse-maladie', analyse_maladie);
    app.get('/analyse-wilaya', analyse_wilaya);
    app.get('/analyse-product', analyse_product);

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
};

startServer();
