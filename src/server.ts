// src/server.ts
import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import cors from 'cors';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

app.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { folderName } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const s3Path = `${folderName}/${Date.now()}-${file.originalname}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: s3Path,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));

    fs.unlinkSync(file.path);

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});