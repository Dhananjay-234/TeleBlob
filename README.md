# TeleBlob 

> **Experimental Object Storage using Telegram Bot API**

TeleBlob is an innovative backend system that uses Telegram's Bot API as an experimental object storage layer for images and videos. Instead of relying on traditional cloud storage services, TeleBlob leverages Telegram's infrastructure to store and retrieve media files.

**Original Author:** Dhananjay Shinde

---

## ⚠️ Disclaimer

This project is **educational and experimental only**. It demonstrates a creative use of the Telegram Bot API but should not be used in production environments. Always review Telegram's Terms of Service before deploying any bot-based solutions.

---

## 🧠 Core Concept

Traditional object storage systems (like AWS S3, Google Cloud Storage) require paid services and complex configurations. TeleBlob explores an alternative approach:

1. **Upload Flow**: Client uploads media → Backend receives file → Bot uploads to private Telegram channel → Telegram returns `file_id` → Backend stores `file_id` in database
2. **Fetch Flow**: Client requests media → Backend retrieves `file_id` from database → Backend downloads from Telegram → Backend proxies file to client
3. **Smart Caching**: Frequently accessed files are cached locally with TTL to minimize Telegram API calls

**Key Insight**: Telegram becomes the "blob storage," while your backend acts as an abstraction layer with caching.

---

## ✨ Features

- ✅ **REST API** for media upload and retrieval
- ✅ **Automatic Telegram Upload** via Bot API
- ✅ **Firebase Firestore** for metadata indexing
- ✅ **Smart Disk Caching** with TTL-based expiration
- ✅ **Security**: Telegram credentials never exposed to clients
- ✅ **Support** for images and videos
- ✅ **Open Source** under Apache 2.0 License

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/upload
       │ GET /api/media/:id
       │
┌──────▼──────────────────────────────────────┐
│          TeleBlob Backend (Node.js)         │
│  ┌────────────────────────────────────────┐ │
│  │  Controllers (Upload/Fetch)            │ │
│  └────────┬──────────────────────┬────────┘ │
│           │                      │          │
│  ┌────────▼────────┐    ┌────────▼────────┐ │
│  │ Telegram Service│    │  Cache Service  │ │
│  │  (Upload/Download)   │  (Disk + TTL)   │ │
│  └────────┬────────┘    └─────────────────┘ │
│           │                                 │
│  ┌────────▼────────┐                        │
│  │ Media Repository│                        │
│  │   (Firestore)   │                        │
│  └─────────────────┘                        │
└──────────────┬──────────────────────────────┘
               │
               │ Bot API
               │
       ┌───────▼────────┐
       │ Telegram Cloud │
       │  (File Storage)│
       └────────────────┘
```

---

## 📁 Project Structure

```
TeleBlob/
├── src/
│   ├── config/
│   │   ├── firebase.js       # Firebase Admin SDK initialization
│   │   └── env.js            # Environment configuration
│   ├── controllers/
│   │   └── mediaController.js # Upload/Fetch/Info/List handlers
│   ├── services/
│   │   ├── telegramService.js # Telegram Bot API integration
│   │   ├── cacheService.js    # Disk-based caching with TTL
│   │   └── mediaRepository.js # Firestore CRUD operations
│   └── routes/
│       └── api.js             # API route definitions
├── app.js                     # Express server entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── LICENSE                    # Apache 2.0
└── README.md
```

---

## 🚀 Quick Setup 

### Requirements
- Node.js v16+
- Telegram Bot Token
- Firebase project (Firestore enabled)

### Steps
1. Clone the repo
2. Install dependencies
3. Configure environment variables
4. Start the server

---
## 📡 API Overview

### Health Check
GET /health  
Returns service status and timestamp.

---

### Upload Media
POST /api/upload  
Content-Type: multipart/form-data

Input:
- file (required): Image or video file
  
```Output:
{
  "success": true,
  "data": {
    "media_id": "<generated-id>",
    "file_type": "image/jpeg",
    "size": 245678
  }
}
```
---

### Fetch Media
GET /api/media/:id  

Returns the requested file.  
First request fetches from Telegram; subsequent requests are served from cache (within TTL).



---


## 🔒 Security Considerations

- ✅ **Bot Token Protection**: Never expose `TELEGRAM_BOT_TOKEN` in client-side code
- ✅ **File ID Abstraction**: Telegram `file_id` is never returned to clients
- ✅ **Proxying**: All media is served through the backend, hiding Telegram infrastructure
- ⚠️ **Rate Limiting**: Consider adding rate limiting for production use
- ⚠️ **Authentication**: This demo has no auth; add JWT/OAuth for real deployments

---

## 🧪 Testing

### Upload a test image:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

### Fetch the uploaded image:
```bash
# Use the media_id from upload response
curl http://localhost:3000/api/media/<media_id> --output result.jpg
```

### Check cache behavior:
1. First fetch: Check logs for "📥 Downloading from Telegram"
2. Second fetch (within 1 hour): Check logs for "📦 Cache HIT"

### Use the Gallery Interface:
Open `gallery.html` in your browser for a a simple grid-based media gallery interface:
- **View all media** in a responsive grid layout
- **Upload new media** via the "+ Upload Media" button
- **Images display inline** automatically
- **Videos play inline** with custom controls
- **Statistics dashboard** shows total media count

---

## 🎨 Gallery Interface

TeleBlob includes a minimal web gallery (`gallery.html`) used to validate inline image and video fetching via the backend API.

### Features
- **📸 Grid Layout**: Responsive gallery similar to Instagram
- **🖼️ Inline Display**: Images and videos load directly from Telegram
- **📊 Statistics**: Real-time count of total media, images, and videos
- **➕ Upload Modal**: Drag-and-drop or click to upload
- **⚡ Smart Loading**: Lazy loading for optimal performance
- **🎬 Video Playback**: Click to play videos with controls

### Usage
1. Open `gallery.html` in your browser
2. Click "+ Upload Media" to add new content
3. View all your media in the grid
4. Click on videos to play them inline
5. All media is fetched from Telegram in the background

**Note**: Make sure the server is running (`npm start`) before opening the gallery.

---

## 🛠️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Required |
| `TELEGRAM_CHAT_ID` | Channel/Group ID for storage | Required |
| `PORT` | Server port | 3000 |
| `CACHE_DIR` | Local cache directory | ./cache |
| `CACHE_TTL_SECONDS` | Cache expiration time | 3600 (1 hour) |

---

## 📊 How It Works

### Upload Process
1. Client sends file via `POST /api/upload`
2. Multer middleware captures file in memory
3. Backend validates file type (images/videos only)
4. Telegram service uploads file to private channel
5. Telegram returns `file_id`
6. Backend saves metadata to Firestore with generated `media_id`
7. Client receives `media_id`

### Fetch Process
1. Client requests `GET /api/media/:id`
2. Backend queries Firestore for metadata
3. Cache service checks if file exists locally
4. **Cache HIT**: Serve from disk
5. **Cache MISS**: Download from Telegram using `file_id`, cache it, then serve
6. Client receives file

### Caching Strategy
- Files are cached on disk (not in memory to support large videos)
- Each file has a TTL (default: 1 hour)
- Expired files are automatically cleaned on server startup
- Cache key is MD5 hash of `media_id`

---

## Why This Approach?

**Pros:**
- ✅ Free storage (within Telegram's limits)
- ✅ No external storage service required
- ✅ Automatic CDN-like distribution (Telegram's infrastructure)
- ✅ Simple to set up

**Cons:**
- ❌ Violates Telegram's intended use case
- ❌ File size limits imposed by Telegram Bot API
- ❌ Dependent on Telegram's availability
- ❌ Not suitable for production/commercial use
- ❌ Potential rate limiting from Telegram

**Use Cases:**
- Educational projects
- Prototyping
- Personal experiments
- Understanding API abstraction patterns

---

## 📝 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

**Original Author:** Dhananjay Shinde

---

## Acknowledgments

- Telegram for providing the Bot API
- Firebase for Firestore database
- The open-source community

---

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Remember:** This is an experimental project for educational purposes. Always respect Telegram's Terms of Service and use responsibly.




