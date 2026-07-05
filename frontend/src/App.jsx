import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { removeBackground } from "@imgly/background-removal";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("home");

  const cards = [
    {
      title: "Текст",
      text: "Генерация, перевод, переписывание и анализ текста с помощью ИИ.",
      icon: "💬",
      className: "purple",
      page: "text",
    },
    {
      title: "Фото",
      text: "Удаление фона и обработка изображений.",
      icon: "🖼️",
      className: "green",
      page: "photo",
    },
    {
      title: "Видео",
      text: "Обработка видео, субтитры и описание роликов.",
      icon: "▶️",
      className: "orange",
      page: "video",
    },
    {
      title: "Файлы",
      text: "Работа с PDF, DOCX, TXT и таблицами.",
      icon: "📄",
      className: "blue",
      page: "files",
    },
  ];

  function renderPage() {
    if (activePage === "text") {
      return (
        <ToolPage
          title="Текст"
          description="Генерация текста, перевод, переписывание и чат."
          goHome={() => setActivePage("home")}
        />
      );
    }

    if (activePage === "photo") {
      return <PhotoPage goHome={() => setActivePage("home")} />;
    }

    if (activePage === "video") {
  return (
    <SimplePage
      title="Видео"
      description="Раздел видео добавим следующим этапом."
      goHome={() => setActivePage("home")}
    />
  );
}

if (activePage === "files") {
  return (
    <SimplePage
      title="Файлы"
      description="Отдельный раздел файлов добавим позже. Сейчас TXT/DOCX/PDF работают внутри текстового чата."
      goHome={() => setActivePage("home")}
    />
  );
}

    return (
      <>
        <section className="hero">
          <div className="floating icon-1">AI</div>
          <div className="floating icon-2">▶</div>
          <div className="floating icon-3">💬</div>
          <div className="floating icon-4">📄</div>

          <h1>AI Hub</h1>
          <h2>Все бесплатные ИИ-инструменты в одном месте</h2>
          <p>Текст, фото, видео, файлы и многое другое — работай умнее с AI.</p>

          <div className="search">
            <span>🔍</span>
            <input placeholder="Найти инструмент..." />
            <button>Поиск</button>
          </div>

          <div className="filters">
            <button>🔥 Популярное</button>
            <button>✨ Новое</button>
            <button>🔠 По алфавиту</button>
            <button>▦ Все категории</button>
          </div>
        </section>

        <main className="cards">
          {cards.map((card) => (
            <div className={`card ${card.className}`} key={card.title}>
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <button onClick={() => setActivePage(card.page)}>
                Открыть <span>→</span>
              </button>
            </div>
          ))}
        </main>
      </>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <button className="logo logo-button" onClick={() => setActivePage("home")}>
          <span className="logo-icon">🧠</span>
          <span>AI Hub</span>
        </button>

        <div className="nav-links">
          <button onClick={() => setActivePage("home")}>Главная</button>
          <button onClick={() => setActivePage("text")}>Текст</button>
          <button onClick={() => setActivePage("photo")}>Фото</button>
          <button onClick={() => setActivePage("video")}>Видео</button>
          <button onClick={() => setActivePage("files")}>Файлы</button>
        </div>

        <button className="favorite">♡ Избранное</button>
      </nav>

      {renderPage()}
    </div>
  );
}

function ToolPage({ title, description, goHome }) {
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem("ai-hub-chats");

    if (savedChats) {
      return JSON.parse(savedChats);
    }

    return [
      {
        id: Date.now(),
        title: "Новый чат",
        messages: [],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedActiveChatId = localStorage.getItem("ai-hub-active-chat");
    return savedActiveChatId ? Number(savedActiveChatId) : null;
  });

  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3-coder:free");
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  useEffect(() => {
    localStorage.setItem("ai-hub-chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChat) {
      localStorage.setItem("ai-hub-active-chat", String(activeChat.id));
    }
  }, [activeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  function updateActiveChatMessages(newMessages) {
    if (!activeChat) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== activeChat.id) return chat;

        const updated =
          typeof newMessages === "function"
            ? newMessages(chat.messages)
            : newMessages;

        return {
          ...chat,
          messages: updated,
          title:
            chat.title === "Новый чат" && updated.length > 0
              ? updated[0].text.slice(0, 28)
              : chat.title,
        };
      })
    );
  }

  function createNewChat() {
    const newChat = {
      id: Date.now(),
      title: "Новый чат",
      messages: [],
    };

    setChats((prevChats) => [newChat, ...prevChats]);
    setActiveChatId(newChat.id);
    setPrompt("");
    setAttachedFile(null);
  }

  function deleteChat(chatId) {
    const filteredChats = chats.filter((chat) => chat.id !== chatId);

    if (filteredChats.length === 0) {
      const newChat = {
        id: Date.now(),
        title: "Новый чат",
        messages: [],
      };

      setChats([newChat]);
      setActiveChatId(newChat.id);
      return;
    }

    setChats(filteredChats);

    if (activeChatId === chatId) {
      setActiveChatId(filteredChats[0].id);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);

    try {
      const response = await fetch("http://https://ai-hub-urgu.onrender.com/api/file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.text || "Ошибка загрузки файла");
        return;
      }

      setAttachedFile({
        name: data.fileName,
        text: data.text,
      });

      updateActiveChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `📎 Файл **${data.fileName}** загружен. Теперь можешь задать вопрос по документу.`,
        },
      ]);
    } catch (error) {
      alert("Ошибка загрузки файла");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  }

  async function sendPrompt() {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;

    const userMessage = {
      role: "user",
      text: currentPrompt,
    };

    const messagesForApi = [
      ...messages,
      attachedFile
        ? {
            role: "user",
            text: `Документ "${attachedFile.name}":\n\n${attachedFile.text}`,
          }
        : null,
      userMessage,
    ].filter(Boolean);

    const messagesForUi = [...messages, userMessage];

    updateActiveChatMessages(messagesForUi);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesForApi,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      updateActiveChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.answer || "Пустой ответ от модели.",
        },
      ]);
    } catch (error) {
      updateActiveChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Ошибка подключения к серверу.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  }

  return (
    <main className="chat-layout">
      <aside className="chat-sidebar">
        <button className="new-chat-button sidebar-new-chat" onClick={createNewChat}>
          + Новый чат
        </button>

        <div className="chat-list">
          {chats.map((chat) => (
            <div
              className={`chat-list-item ${
                chat.id === activeChat?.id ? "active-chat" : ""
              }`}
              key={chat.id}
            >
              <button onClick={() => setActiveChatId(chat.id)}>
                {chat.title}
              </button>

              <button className="delete-chat" onClick={() => deleteChat(chat.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-page">
        <div className="chat-top-buttons">
          <button className="back-button" onClick={goHome}>
            ← Назад
          </button>
        </div>

        <h1>{title}</h1>
        <p>{description}</p>

        <div className="model-select-box">
          <label>Модель:</label>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="qwen/qwen3-coder:free">Qwen 3 Coder Free</option>
            <option value="deepseek/deepseek-r1:free">DeepSeek R1 Free</option>
            <option value="openrouter/free">Auto Free Model</option>
            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
            <option value="deepseek/deepseek-r1">DeepSeek R1</option>
          </select>
        </div>

        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="empty-chat">
              Напиши первый запрос, и ИИ ответит здесь.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                className={`message ${
                  message.role === "user" ? "user-message" : "ai-message"
                }`}
                key={index}
              >
                <div className="message-author">
                  {message.role === "user" ? "👤 Ты" : "🤖 AI"}
                </div>

                <div className="message-text">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message ai-message">
              <div className="message-author">🤖 AI</div>
              <div className="message-text">Думаю...</div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="file-upload-box">
          <label className="file-upload-button">
            📎 Загрузить TXT/DOCX/PDF
            <input
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
              hidden
            />
          </label>

          {attachedFile && (
            <div className="attached-file">
              📄 {attachedFile.name}
              <button onClick={() => setAttachedFile(null)}>×</button>
            </div>
          )}
        </div>

        <div className="chat-input">
          <textarea
            spellCheck={false}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши сообщение..."
          />

          <button onClick={sendPrompt} disabled={isLoading}>
            {isLoading ? "Ждём..." : "Отправить"}
          </button>
        </div>
      </section>
    </main>
  );
}

function PhotoPage({ goHome }) {
  const [activePhotoTool, setActivePhotoTool] = useState(null);

  const photoTools = [
    {
      id: "remove-bg",
      title: "Удаление фона",
      description: "Убрать фон с изображения и скачать PNG.",
      icon: "✂️",
      className: "green",
    },
    {
      id: "upscale",
      title: "Улучшение качества",
      description: "Повышение качества, резкости и детализации фото.",
      icon: "✨",
      className: "blue",
    },
    {
      id: "generate",
      title: "Генерация изображения",
      description: "Создание изображения по текстовому описанию.",
      icon: "🎨",
      className: "purple",
    },
    {
      id: "edit",
      title: "Обработка фото",
      description: "Редактирование, очистка и изменение изображения.",
      icon: "🛠️",
      className: "orange",
    },
  ];

  if (activePhotoTool === "remove-bg") {
  return (
    <RemoveBackgroundTool
      goBack={() => setActivePhotoTool(null)}
      goHome={goHome}
    />
  );
}

if (activePhotoTool === "generate") {
  return (
    <GenerateImageTool
      goBack={() => setActivePhotoTool(null)}
      goHome={goHome}
    />
  );
}

  if (activePhotoTool) {
    const tool = photoTools.find((item) => item.id === activePhotoTool);

    return (
      <main className="photo-page">
        <button className="back-button" onClick={() => setActivePhotoTool(null)}>
          ← Назад к фото
        </button>

        <h1>{tool.title}</h1>
        <p>{tool.description}</p>

        <div className="photo-tool-card">
          <div className="empty-result">
            Этот инструмент добавим следующим этапом.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="photo-page">
      <button className="back-button" onClick={goHome}>
        ← Назад
      </button>

      <h1>Фото</h1>
      <p>Выбери инструмент для работы с изображениями.</p>

      <div className="photo-tools-grid">
        {photoTools.map((tool) => (
          <button
            className={`photo-menu-card ${tool.className}`}
            key={tool.id}
            onClick={() => setActivePhotoTool(tool.id)}
          >
            <div className="photo-menu-icon">{tool.icon}</div>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <span>Открыть →</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function RemoveBackgroundTool({ goBack, goHome }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setResultImage("");
    setStatusText("");
    setPreview(URL.createObjectURL(file));
  }

  async function handleRemoveBackground() {
    if (!selectedImage || isLoading) return;

    setIsLoading(true);
    setStatusText("Удаляю фон... Первый запуск может занять немного времени.");

    try {
      const resultBlob = await removeBackground(selectedImage);
      const resultUrl = URL.createObjectURL(resultBlob);

      setResultImage(resultUrl);
      setStatusText("Готово!");
    } catch (error) {
      console.error("PHOTO ERROR:", error);
      alert(error.message || "Ошибка удаления фона");
      setStatusText("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="photo-page">
      <div className="chat-top-buttons">
        <button className="back-button" onClick={goBack}>
          ← Назад к фото
        </button>

        <button className="back-button" onClick={goHome}>
          На главную
        </button>
      </div>

      <h1>Удаление фона</h1>
      <p>Работает локально в браузере, без API-ключей и credits.</p>

      <div className="photo-tools">
        <div className="photo-tool-card">
          <label className="photo-upload-button">
            📎 Выбрать фото
            <input type="file" accept="image/*" onChange={handleImageChange} hidden />
          </label>

          {preview && (
            <div className="photo-preview-grid">
              <div>
                <h3>Исходное фото</h3>
                <img src={preview} alt="Исходное фото" />
              </div>

              <div>
                <h3>Результат</h3>
                {resultImage ? (
                  <img src={resultImage} alt="Фото без фона" />
                ) : (
                  <div className="empty-result">Результат появится здесь</div>
                )}
              </div>
            </div>
          )}

          {statusText && <p className="photo-status">{statusText}</p>}

          <button
            className="photo-action-button"
            onClick={handleRemoveBackground}
            disabled={!selectedImage || isLoading}
          >
            {isLoading ? "Обрабатываю..." : "Удалить фон"}
          </button>

          {resultImage && (
            <a
              className="download-button"
              href={resultImage}
              download="removed-background.png"
            >
              Скачать PNG
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
function GenerateImageTool({ goBack, goHome }) {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState(
    "stabilityai/stable-diffusion-xl-base-1.0"
  );
  const [isLoading, setIsLoading] = useState(false);

  const imageModels = [
    {
      id: "stabilityai/stable-diffusion-xl-base-1.0",
      name: "Stable Diffusion XL",
    },
    {
      id: "runwayml/stable-diffusion-v1-5",
      name: "Stable Diffusion 1.5",
    },
    {
      id: "prompthero/openjourney",
      name: "OpenJourney",
    },
  ];

  async function generateImage() {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl("");

    try {
      const response = await fetch("http://localhost:5000/api/image/huggingface", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model: selectedImageModel,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Ошибка генерации");
        return;
      }

      setImageUrl(data.image);
    } catch (error) {
      alert("Ошибка подключения к backend");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="photo-page">
      <div className="chat-top-buttons">
        <button className="back-button" onClick={goBack}>
          ← Назад к фото
        </button>

        <button className="back-button" onClick={goHome}>
          На главную
        </button>
      </div>

      <h1>Генерация изображений</h1>
      <p>Генерация через Hugging Face. Бесплатно, но с лимитами.</p>

      <div className="photo-tool-card">
        <div className="image-generator-controls">
          <div>
            <label>Модель:</label>
            <select
              value={selectedImageModel}
              onChange={(e) => setSelectedImageModel(e.target.value)}
            >
              {imageModels.map((model) => (
                <option value={model.id} key={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          className="image-prompt-input"
          placeholder="Например: futuristic cyberpunk city at night, cinematic lighting"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          className="photo-action-button"
          onClick={generateImage}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? "Генерируем..." : "Сгенерировать"}
        </button>

        {imageUrl && (
          <>
            <div className="generated-image-box">
              <img src={imageUrl} alt="Generated" className="generated-image" />
            </div>

            <a
              href={imageUrl}
              download="generated-image.png"
              className="download-button"
            >
              Скачать PNG
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default App;