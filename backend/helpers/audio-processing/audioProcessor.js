const speech = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs").promises;
const serviceAccount = require("../../config/expensesmanager-gcp.json");
const path = require("path");
const { exec } = require("child_process");
const { deleteFile } = require("../utility");
// Initialize clients

const storage = new Storage({
  credentials: serviceAccount,
});
const speechClient = new speech.SpeechClient({
  credentials: serviceAccount,
});
const ttsClient = new textToSpeech.TextToSpeechClient({
  credentials: serviceAccount,
});

const bucketName = process.env.GCS_BUCKET_NAME;

const convertAudioToWav = (inputPath, extension) => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(extension, ".wav");

    const command = `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 "${outputPath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg conversion error:", error);
        reject(error);
      } else {
        console.log(`✅ ${extension} converted to WAV:`, outputPath);
        try {
          await deleteFile(inputPath);
          console.log("🗑️ Deleted original CAF file:", inputPath);
        } catch (deleteError) {
          console.log(
            "⚠️ Could not delete original CAF file:",
            deleteError.message
          );
        }

        resolve(outputPath);
      }
    });
  });
};

const handleLongAudio = async (audioFilePath) => {
  return new Promise(async (resolve, reject) => {
    const fileName = `temp-audio/${path.basename(audioFilePath)}`;
    console.log(fileName);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    try {
      const audioBytes = await fs.readFile(audioFilePath);
      await file.save(audioBytes, {
        metadata: {
          contentType: "audio/wav",
        },
      });

      const gcsUri = `gs://${bucketName}/${fileName}`;

      console.log("✅ Uploaded to:", gcsUri);
      const request = {
        audio: { uri: gcsUri },
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
          model: "latest_long",
          useEnhanced: true,
        },
      };

      const [operation] = await speechClient.longRunningRecognize(request);
      const [response] = await operation.promise();

      // Clean up file
      await file.delete().catch(console.error);

      if (!response.results || response.results.length === 0) {
        throw "No speech detected in audio";
      }

      const result = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      resolve(result);
    } catch (error) {
      // Clean up on error
      await file.delete().catch(console.error);
      reject(error);
    }
  });
};

// Convert audio file to text using Google Speech-to-Text
const speechToText = (audioFilePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if file exists
      const fileExists = await fs
        .access(audioFilePath)
        .then(() => true)
        .catch(() => false);
      if (!fileExists) {
        return reject("Audio file not found: " + audioFilePath);
      }

      const audioBytes = await fs.readFile(audioFilePath);
      console.log("🎤 File size:", audioBytes.length, "bytes");
      if (audioBytes.length === 0) {
        return reject("Audio file is empty");
      }

      const estimatedDuration = audioBytes.length / 32000;

      if (estimatedDuration > 55) {
        console.log("🕐 Long audio detected, using longRunningRecognize");
        try {
          const result = await handleLongAudio(audioFilePath);
          resolve(result);
        } catch (err) {
          throw err;
        }
      } else {
        const request = {
          audio: {
            content: audioBytes.toString("base64"),
          },
          config: {
            encoding: "LINEAR16", // or 'LINEAR16' for wav files
            sampleRateHertz: 16000,
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
            model: "latest_long",
            useEnhanced: true,
          },
        };

        const [response] = await speechClient.recognize(request);

        if (!response.results || response.results.length === 0) {
          return reject("No speech detected in audio");
        }

        const transcription = response.results
          .map((result) => result.alternatives[0].transcript)
          .join("\n");
        resolve(transcription);
      }
    } catch (error) {
      console.error("Speech-to-Text error:", error);
      reject("Failed to convert speech to text: " + error.message);
    }
  });
};

// Convert text to audio using Google Text-to-Speech
const textToSpeechConvert = (text, saveFile = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("🔊 Converting text to speech...");

      if (!text || text.trim() === "") {
        return reject(new Error("No text provided for speech synthesis"));
      }

      const request = {
        input: { text: text.substring(0, 5000) }, // Limit text length
        voice: {
          languageCode: "en-US",
          name: "en-US-Chirp3-HD-Despina",
        },
        audioConfig: {
          audioEncoding: "LINEAR16",
          effectsProfileId: ["telephony-class-application"],
          speakingRate: 1,
          pitch: 0,
        },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);

      if (!response.audioContent) {
        return reject("No audio content generated");
      }

      if (saveFile) {
        const rootDir = process.cwd();
        let audioDir = path.join(rootDir, `voice-chat-uploads/temp`);
        fs.mkdir(audioDir, { recursive: true });
        audioDir += `/tts_${Date.now()}.wav`;
        fs.writeFile(audioDir, response.audioContent);
      }

      const audioBase64 = response.audioContent.toString("base64");

      resolve({
        audioData: audioBase64,
        mimeType: "audio/wav",
        encoding: "base64",
      });
    } catch (error) {
      console.error("Text-to-Speech error:", error);
      reject("Failed to convert text to speech: " + error.message);
    }
  });
};

module.exports = {
  speechToText,
  textToSpeechConvert,
  convertAudioToWav,
};
