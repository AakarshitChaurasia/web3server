const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const AWS = require("aws-sdk");
let multer = require("multer");

const bucketName = process.env.bucketName;

const awsConfig = {
    accessKeyId: process.env.AccessKey,
    secretAccessKey: process.env.SecretKey,
    region: process.env.region,
};

const S3 = new AWS.S3(awsConfig);

const PORT = 3000;

const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Specify the multer config
let upload = multer({
    // storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: function (req, file, done) {
        if (
          file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          done(null, true);
        } else {
          //prevent the upload
          var newError = new Error("File type is incorrect");
          newError.name = "MulterError";
          done(newError, false);
        }
    },
});

//upload to s3
const uploadToS3 = (fileData) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: `${Date.now().toString()}.docx`,
            Body: fileData,
        };
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            console.log(data);
            return resolve(data);
        });
    });
};

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Handle file upload
app.post("/upload", upload.single("image"), async (req, res) => {
  console.log(req.file);
  if (req.file) {
    await uploadToS3(req.file.buffer);
  }

  res.send(`
 <div>
  <div id="message"  style="color: red; font-weight: bold;">
    FILE(.docx) uploaded successfully
  </div>
</div>
`);
});

app.listen(PORT, () => console.log("server is running on " + PORT));
