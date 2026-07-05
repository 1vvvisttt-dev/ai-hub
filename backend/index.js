import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { HfInference } from "@huggingface/inference";


dotenv.config();
const hf = new HfInference(process.env.HF_TOKEN);
const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    project: "AI Hub",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        answer: "Пустой запрос",
      });
    }

    const selectedModel = model || "openrouter/free";

    const openRouterMessages = [
      {
        role: "system",
        content: "Ты полезный ИИ-ассистент. Отвечай на русском языке.",
      },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: selectedModel,
        messages: openRouterMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AI Hub",
        },
      }
    );

    res.json({
      success: true,
      answer: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("=== OPENROUTER ERROR ===");

    if (error.response) {
      console.error(error.response.data);

      return res.status(error.response.status || 500).json({
        success: false,
        answer:
          error.response.data?.error?.message ||
          JSON.stringify(error.response.data),
      });
    }

    console.error(error.message);

    return res.status(500).json({
      success: false,
      answer: error.message,
    });
  }
});

app.post("/api/file", upload.single("file"), async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        text: "Файл не загружен",
      });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname.toLowerCase();

    let fileText = "";

    if (originalName.endsWith(".txt")) {
      fileText = fs.readFileSync(filePath, "utf-8");
    } else if (originalName.endsWith(".docx")) {
      const data = await mammoth.extractRawText({ path: filePath });
      fileText = data.value;
    } else {
      return res.status(400).json({
        success: false,
        text: "Пока поддерживаются только TXT и DOCX",
      });
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      text: fileText.slice(0, 12000),
    });
  } catch (error) {
    console.error("=== FILE ERROR ===");
    console.error(error.message);

    res.status(500).json({
      success: false,
      text: "Ошибка обработки файла",
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

app.post("/api/image/generate", async (req, res) => {
  try {
    const { prompt, model, size } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Промпт пустой",
      });
    }

    const selectedModel = model || "openrouter/free";
    const selectedSize = size || "1024x1024";

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: selectedModel,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}. Size: ${selectedSize}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AI Hub",
        },
      }
    );

    const message = response.data.choices?.[0]?.message;

    const imageFromImagesArray =
      message?.images?.[0]?.image_url?.url ||
      message?.images?.[0]?.url;

    const imageFromContentArray = Array.isArray(message?.content)
      ? message.content.find((item) => item.type === "image_url")?.image_url?.url
      : null;

    const imageFromString =
      typeof message?.content === "string" &&
      message.content.includes("data:image")
        ? message.content.match(/data:image\/[^)\s"]+/)?.[0]
        : null;

    const imageUrl =
      imageFromImagesArray || imageFromContentArray || imageFromString;

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        message: "Модель не вернула изображение. Попробуй другую модель.",
        raw: message,
      });
    }

    res.json({
      success: true,
      image: imageUrl,
    });
  } catch (error) {
    console.error("=== IMAGE GENERATION ERROR ===");

    if (error.response) {
      console.error(error.response.data);

      return res.status(error.response.status || 500).json({
        success: false,
        message:
          error.response.data?.error?.message ||
          JSON.stringify(error.response.data),
      });
    }

    console.error(error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
app.post("/api/image/huggingface", async (req, res) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Промпт пустой",
      });
    }

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "HF_TOKEN не найден в .env",
      });
    }

    const selectedModel = model || "stabilityai/stable-diffusion-xl-base-1.0";

    const imageBlob = await hf.textToImage({
      model: selectedModel,
      inputs: prompt,
    });

    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    res.json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("=== HUGGING FACE IMAGE ERROR ===");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Ошибка генерации Hugging Face",
    });
  }
});

const server = app.listen(5000, () => {
  console.log("🚀 Backend работает");
  console.log("http://localhost:5000");
});

server.on("error", (error) => {
  console.error("Ошибка запуска backend:");
  console.error(error);
});

process.stdin.resume();