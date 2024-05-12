import express from "express";
import dotenv from "dotenv";
import path from "path";
import url from 'url';
import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Amazon Rekognition client
const client = new RekognitionClient({ region: 'eu-central-1' });

// Determine which folder to servce
console.log(`Running in ${process.env.NODE_ENV}...`);
const uiFolder = process.env.NODE_ENV === "development" ? "./uimodule/webapp" : "./uimodule/dist";

// Register routes
app.use("/", express.static(path.join(__dirname, uiFolder)));
app.post("/facial-analysis", async function (req, res) {
  console.log("Preparing new detect faces command for Amazon Rekognition");

  // Convert the image to a Byte Buffer
  let imageBytes = Buffer.from(req.body.imageBase64, 'base64');

  // Send the Detect Faces Command to Amazon Rekognition
  const command = new DetectFacesCommand({
    Image: { Bytes: imageBytes },
    Attributes: ["ALL"],
  });
  const response = await client.send(command);

  // Send the facial analysis response
  console.log(`Response for ${response.$metadata.requestId}: ${response.$metadata.httpStatusCode}`);
  res.send(response);
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server started at http://localhost:${port}`));
