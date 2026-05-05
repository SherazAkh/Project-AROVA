const fs = require('fs');
const path = require('path');

const modelDir = path.join(__dirname, 'Model');

function cleanupDuplicateModels() {
    try {
        const folders = fs.readdirSync(modelDir);
        
        folders.forEach(folder => {
            const folderPath = path.join(modelDir, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath);
                const glbFiles = files.filter(f => f.toLowerCase().endsWith('.glb'));
                
                if (glbFiles.length > 1) {
                    console.log(`Found multiple models in ${folder}:`, glbFiles);
                    
                    // Sort by modification time, newest first
                    const sorted = glbFiles.map(f => ({
                        name: f,
                        time: fs.statSync(path.join(folderPath, f)).mtime.getTime()
                    })).sort((a, b) => b.time - a.time);
                    
                    // Keep the newest, delete others
                    const newest = sorted[0].name;
                    console.log(`Keeping newest: ${newest}`);
                    
                    sorted.slice(1).forEach(item => {
                        const oldPath = path.join(folderPath, item.name);
                        console.log(`Deleting old model: ${item.name}`);
                        fs.unlinkSync(oldPath);
                    });
                }
            }
        });
        
        console.log('Cleanup complete.');
    } catch (err) {
        console.error('Error during cleanup:', err);
    }
}

cleanupDuplicateModels();
