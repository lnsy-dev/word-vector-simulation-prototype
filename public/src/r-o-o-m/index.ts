import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { appendFile } from 'fs/promises';

// Load environment variables
dotenv.config();

const app = express();
const port = 80;

// Add JSON body parser middleware
app.use(express.json());

// Ensure TARGET_FOLDER is defined
if (!process.env.TARGET_FOLDER) {
    console.error('TARGET_FOLDER is not defined in .env file');
    process.exit(1);
}

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve static files from TARGET_FOLDER
app.use(express.static(process.env.TARGET_FOLDER));

// Helper function to create tuples from filenames
function createImageTuples(files: string[]) {
    console.log('Starting tuple creation with files:', files.length);
    const tuples: { texture: string; depthMap: string }[] = [];
    const fileMap = new Map<string, string[]>();

    // Group files by their number after the dash
    files.forEach(file => {
        const parts = file.split('-');
        if (parts.length !== 2) {
            console.warn(`Skipping file with invalid format: ${file}`);
            return;
        }
        
        const postNumber = parts[1].split('.')[0]; // Get number after dash, before extension
        console.log(`Processing file: ${file}, Post number: ${postNumber}`);
        
        if (!fileMap.has(postNumber)) {
            fileMap.set(postNumber, []);
        }
        fileMap.get(postNumber)?.push(file);
    });

    console.log('File grouping complete. Number of groups:', fileMap.size);

    // Create tuples from grouped files
    for (const [postNumber, groupedFiles] of fileMap) {
        console.log(`Creating tuple for post number ${postNumber} with ${groupedFiles.length} files:`, groupedFiles);
        if (groupedFiles.length === 2) {
            // Sort files so the lower numbered file (texture) comes first
            groupedFiles.sort((a, b) => {
                const aNum = parseInt(a.split('-')[0]);
                const bNum = parseInt(b.split('-')[0]);
                return aNum - bNum;
            });
            
            tuples.push({
                texture: groupedFiles[0],
                depthMap: groupedFiles[1]
            });
        } else {
            console.warn(`Skipping invalid group for post number ${postNumber}: expected 2 files, got ${groupedFiles.length}`);
        }
    }

    console.log('Tuple creation complete. Number of valid tuples:', tuples.length);
    return tuples;
}

interface VoteRequest {
    texture: string;
    depthMap: string;
    vote: number;
}

// New endpoint for random image pair
app.get('/api/getRandomImage', async (req: Request, res: Response) => {
    try {
        const targetPath = process.env.TARGET_FOLDER;
        if (!targetPath) {
            throw new Error('TARGET_FOLDER is not defined');
        }
        console.log('Reading directory:', targetPath);
        
        const files = await fs.readdir(targetPath);
        console.log('Found files in directory:', files.length);

        const imageTuples = createImageTuples(files);
        
        if (imageTuples.length === 0) {
            console.error('No valid image pairs found in directory');
            throw new Error('No valid image pairs found');
        }

        const randomIndex = Math.floor(Math.random() * imageTuples.length);
        const randomTuple = imageTuples[randomIndex];
        console.log('Selected random tuple index:', randomIndex, 'out of', imageTuples.length);
        console.log('Selected tuple:', randomTuple);

        const response = {
            texture: randomTuple.texture,
            depthMap: randomTuple.depthMap
        };
        console.log('Sending response:', response);

        res.json(response);
    } catch (error) {
        console.error('Error getting random image:', error);
        res.status(500).json({ error: 'Failed to get random image pair' });
    }
});

// Add vote endpoint
app.post('/api/vote', async (req: Request<{}, {}, VoteRequest>, res: Response) => {
    try {
        const { texture, depthMap, vote } = req.body;

        if (!texture || !depthMap || ![1, -1].includes(vote)) {
            return res.status(400).json({ error: 'Invalid vote data' });
        }

        // Create CSV line
        const csvLine = `${texture},${depthMap},${vote}\n`;

        // Append to votes.csv
        await appendFile('votes.csv', csvLine);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).json({ error: 'Failed to save vote' });
    }
});

// Serve index.html for the root route
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});