const mongoose = require('mongoose');

// Define product schema manually to match the server-side model
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    ratings: { type: Number, default: 0 },
    images: [{ public_id: String, url: String }],
    category: String,
    modelSrc: String,
    stock: { type: Number, default: 100 },
    numOfReviews: { type: Number, default: 0 },
    reviews: [{
        user: mongoose.Schema.ObjectId,
        name: String,
        rating: String,
        comment: String,
    }],
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema, 'products');

const sampleProducts = [
    {
        name: "Luxury Velvet Sofa",
        description: "Experience ultimate comfort with our handcrafted velvet sofa. Perfect for modern living rooms, this sofa features high-density foam and a solid oak frame.",
        price: 85000,
        category: "Furniture",
        modelSrc: "Zoney",
        images: [
            { public_id: "zoney1", url: "http://192.168.18.18:4000/api/v1/model/Zoney/Zoney1.png" },
            { public_id: "zoney2", url: "http://192.168.18.18:4000/api/v1/model/Zoney/Zoney2.png" }
        ],
        reviews: [{ name: "John", rating: "5", comment: "Amazing sofa!" }]
    },
    {
        name: "Modern Ergonomic Chair",
        description: "Perfect for your home office. This chair features lumbar support and 3D armrests. Stay productive and comfortable all day.",
        price: 18500,
        category: "Furniture",
        modelSrc: "Chair",
        images: [
            { public_id: "chair1", url: "http://192.168.18.18:4000/api/v1/model/Chair/Chair1.jpg" },
            { public_id: "chair2", url: "http://192.168.18.18:4000/api/v1/model/Chair/Chair2.jpg" }
        ],
        reviews: [{ name: "Alice", rating: "5", comment: "Great support!" }]
    },
    {
        name: "Premium Bass Headphones",
        description: "Immersive sound experience with deep bass and crystal clear highs. Comfortable ear cushions for long listening sessions.",
        price: 8900,
        category: "Electronics",
        modelSrc: "Headphones",
        images: [
            { public_id: "headphones1", url: "http://192.168.18.18:4000/api/v1/model/Headphones/Headphones1.png" },
            { public_id: "headphones2", url: "http://192.168.18.18:4000/api/v1/model/Headphones/Headphones2.png" }
        ],
        reviews: [{ name: "Jake", rating: "5", comment: "Unbelievable bass!" }]
    },
    {
        name: "Sony WH-1000XM4",
        description: "Industry-leading noise cancellation. Perfect for travel or deep focus. 30-hour battery life and touch controls.",
        price: 24900,
        category: "Electronics",
        modelSrc: "SonyHeadphones",
        images: [
            { public_id: "sony1", url: "http://192.168.18.18:4000/api/v1/model/SonyHeadphones/SonyHeadphones1.png" },
            { public_id: "sony2", url: "http://192.168.18.18:4000/api/v1/model/SonyHeadphones/SonyHeadphones2.png" }
        ],
        reviews: [{ name: "David", rating: "5", comment: "Noise cancellation is magic." }]
    },
    {
        name: "Smart 4K UHD TV",
        description: "Crystal clear picture quality with HDR10+. Built-in streaming apps and voice control for a home cinema experiment.",
        price: 55000,
        category: "Electronics",
        modelSrc: "TV",
        images: [
            { public_id: "tv1", url: "http://192.168.18.18:4000/api/v1/model/TV/TV1.jpg" },
            { public_id: "tv2", url: "http://192.168.18.18:4000/api/v1/model/TV/TV2.jpg" }
        ],
        reviews: [{ name: "Kevin", rating: "4", comment: "Great picture!" }]
    },
    {
        name: "Flagship Smartphone",
        description: "The fastest processor and professional-grade camera system. All-day battery life and stunning OLED display.",
        price: 99000,
        category: "Electronics",
        modelSrc: "Phone",
        images: [
            { public_id: "phone1", url: "http://192.168.18.18:4000/api/v1/model/Phone/Phone1.png" },
            { public_id: "phone2", url: "http://192.168.18.18:4000/api/v1/model/Phone/Phone2.png" }
        ],
        reviews: [{ name: "Chloe", rating: "5", comment: "Camera is insane!" }]
    }
];

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Ecommerce');
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        const userId = "69ce7d45b1b1cbdda3e76dee";

        const productsToInsert = sampleProducts.map(p => ({
            ...p,
            user: userId,
            ratings: p.reviews.reduce((acc, r) => acc + Number(r.rating), 0) / p.reviews.length,
            numOfReviews: p.reviews.length,
            reviews: p.reviews.map(r => ({ ...r, user: userId }))
        }));

        await Product.insertMany(productsToInsert);
        console.log(`Inserted ${productsToInsert.length} products successfully!`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
