require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 3000;

const JOB_FILE = path.join(__dirname, 'jobs/jobs.json');

function readJobs() {
  return JSON.parse(fs.readFileSync(JOB_FILE, 'utf-8'));
}

function writeJobs(data) {
  fs.writeFileSync(JOB_FILE, JSON.stringify(data, null, 2));
}

app.post("/process", upload.fields([{ name: "audio" }, { name: "image" }]), (req, res) => {

  const jobId = Date.now().toString();

  const audioFile = req.files["audio"][0].path;
  const imageFile = req.files["image"][0].path;

  const jobs = readJobs();

  jobs[jobId] = {
    audioPath: audioFile,
    imagePath: imageFile,
    status: "pending",
    wavPath: null,
    error: null
  };

  writeJobs(jobs);

  res.json({ jobId, message: "Job queued" });
});

app.get("/result/:jobId", (req, res) => {
  const jobs = readJobs();
  const job = jobs[req.params.jobId];

  if (!job) return res.status(404).send("Job not found");

  if (job.status === "done") {
    res.sendFile(path.join(__dirname, job.wavPath));
  } else if (job.status === "pending" || job.status === "processing") {
    res.json({ status: job.status });
  } else {
    res.status(500).json({ status: "error", error: job.error });
  }
});

app.get("/", (req, res) => res.send("BlindEye Server Running"));

app.listen(PORT, () => console.log("Server started on port", PORT));
