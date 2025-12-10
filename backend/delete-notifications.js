// Script simple para borrar notificaciones
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({}, { strict: false, collection: 'notifications' });
const Notification = mongoose.model('Notification', notificationSchema);

async function deleteAll() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hubbies');

        const result = await Notification.deleteMany({});
        console.log(`✅ Eliminadas ${result.deletedCount} notificaciones`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteAll();
