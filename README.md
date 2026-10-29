# AdultScript 🔞

A basic Node.js video portal template designed for easy deployment on cPanel and other hosting environments.

## 🚀 Features
- Dark-themed responsive UI.
- Video gallery grid.
- Dedicated video player page.
- Lightweight Express.js backend.

## 🛠 Installation Guide (cPanel)

Since you are using cPanel, follow these steps to get the site live:

### 1. Upload Files
Upload all project files (except `node_modules`) to your server using File Manager or FTP.

### 2. Setup Node.js Application
1. Log in to your **cPanel**.
2. Search for **"Setup Node.js App"** in the software section.
3. Click **"Create Application"**.
4. Fill in the following details:
   - **Node.js version**: Select the latest stable version (e.g., 16.x or 18.x).
   - **Application mode**: Production.
   - **Application root**: The folder where you uploaded the files (e.g., `adultscript`).
   - **Application URL**: Choose the domain or subdomain you want the site to live on.
   - **Application startup file**: `index.js`.
5. Click **Create**.

### 3. Install Dependencies
1. Once the app is created, you will see a button that says **"Run NPM Install"**. Click it.
2. This will automatically install `express` and `ejs` based on the `package.json` file.

### 4. Start the App
1. Click **"Restart"** if the application is not already running.
2. Visit your Application URL to see the site!

## ⚙️ Configuration
Currently, the videos are stored in a mock array in `index.js`. 

**To add your own videos:**
Open `index.js` and edit the `videos` array:
```javascript
const videos = [
  { 
    id: '1', 
    title: 'Your Video Title', 
    thumbnail: 'https://your-image-url.com/thumb.jpg', 
    url: 'https://your-video-url.com/video.mp4' 
  },
];
```

## 📁 Project Structure
- `/public` - Static assets (CSS, Images).
- `/views` - EJS templates for HTML rendering.
- `index.js` - Main server logic and routing.
- `package.json` - Project dependencies and scripts.
