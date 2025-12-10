// Script para limpiar notificaciones viejas y probar el sistema
// Ejecutar con: node cleanup-notifications.js

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelo
const Notification = require('./models/notification');

async function cleanupNotifications() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hubbies', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Conectado a MongoDB');

        // Eliminar todas las notificaciones existentes
        const result = await Notification.deleteMany({});
        console.log(`✅ Eliminadas ${result.deletedCount} notificaciones antiguas`);

        console.log('\n📝 Ahora crea un nuevo comentario para generar notificaciones frescas con el formato correcto.');

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanupNotifications();
