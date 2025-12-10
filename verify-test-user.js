const mongoose = require('mongoose');
const User = require('./backend/models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Hubbies', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function verifyUser(email) {
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        user.isVerified = true;
        await user.save();
        console.log('✅ User verified successfully:', user.email);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Verify the test user
verifyUser('test@example.com');
