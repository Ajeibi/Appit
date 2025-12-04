const { sequelize } = require('./config/database');

async function addAttachmentColumn() {
    try {
        await sequelize.query(`
            ALTER TABLE Appraisals 
            ADD COLUMN attachment TEXT;
        `);
        console.log('✅ Successfully added attachment column');
        process.exit(0);
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('ℹ️  Attachment column already exists');
            process.exit(0);
        } else {
            console.error('❌ Error adding attachment column:', error.message);
            process.exit(1);
        }
    }
}

addAttachmentColumn();
