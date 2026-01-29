# TeleBlob 

> **Experimental Object Storage using Telegram Bot API**

TeleBlob is an innovative backend system that uses Telegram's Bot API as an experimental object storage layer for images and videos. Instead of relying on traditional cloud storage services, TeleBlob leverages Telegram's infrastructure to store and retrieve media files.


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
├── test.html                  # Web Interface to test the file retrieval
├── gallery.html               # Web Gallery Interface to fetch media inline
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

Output:
{
  "success": true,
  "data": {
    "media_id": "<generated-id>",
    "file_type": "image/jpeg",
    "size": 245678
  }
}

---

### Fetch Media
GET /api/media/:id  

Returns the requested file.  
- First request: fetched from Telegram and cached  
- Subsequent requests (within TTL): served from cache

---

### Media Info
GET /api/media/:id/info  

Returns metadata for the given media ID.

---

### List Media
GET /api/media?limit=100  

Returns a list of stored media metadata.


---


## 🔒 Security Considerations

- ✅ **Bot Token Protection**: Never expose `TELEGRAM_BOT_TOKEN` in client-side code
- ✅ **File ID Abstraction**: Telegram `file_id` is never returned to clients
- ✅ **Proxying**: All media is served through the backend, hiding Telegram infrastructure
- ⚠️ **Rate Limiting**: Consider adding rate limiting for production use
- ⚠️ **Authentication**: This demo has no auth; add JWT/OAuth for real deployments

---

## 🧪 Testing 

### Uploading a Test Image

To test the system, upload any image or video using:

* The web gallery interface, or
* Any client connected to the backend

Once uploaded:

* The backend sends the file to Telegram
* A unique media ID is generated and stored
* The file becomes available for retrieval

---

### Fetching the Uploaded Media

After uploading, you can view or download the media using its generated media ID.

* The backend retrieves the file reference
* If the file is already cached, it is served immediately
* If not cached, it is fetched from Telegram and then served

---

### Verifying Cache Behavior

To confirm that caching works correctly:

1. On the **first access**, the backend downloads the file from Telegram
2. On **subsequent accesses (within the cache duration)**, the file is served directly from cache

This reduces repeated Telegram API calls and improves performance.

---

### Using the Web Interfaces

TeleBlob includes a simple web gallery (`gallery.html`) to verify inline media fetching, and a minimal Frontend interface (`test.html`) to test media retrieval using a media ID.

Using the gallery, you can:

* View all uploaded media in a grid layout
* Upload new images or videos
* See images displayed inline automatically
* Play videos directly in the browser
* View basic statistics such as total media count

How the Test Interface Works

1. When an image or video is uploaded, the backend sends the file to a private Telegram channel using the Bot API.
2. Telegram stores the file and returns a unique identifier.
3. The backend saves this identifier and generates a **media ID**.
4. The test interface (`test.html`) displays this media ID after upload.
5. The same media ID can then be used in the test interface to fetch the media again.
6. The backend retrieves the file from Telegram and displays it inline in the browser.

This verifies that media can be reliably stored and retrieved using only its ID, without exposing Telegram details.

**Note:** The backend server must be running before opening the gallery.

---

### Purpose of This Testing Section

This section focuses on **functional validation**, not command-line testing.
It ensures that:

* Uploads work correctly
* Media retrieval functions as expected
* Caching behavior is effective
* Inline rendering works through the backend

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

**Author:** Dhananjay Shinde

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







