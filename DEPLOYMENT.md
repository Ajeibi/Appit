# Deployment Guide: Agro Preciso Appraisal System

This guide covers how to prepare your application, push it to GitHub, and deploy it to a cPanel subdomain.

## Part 1: Prepare the Application for Production

Since cPanel works best with a single Node.js application, we will configure the backend to serve the frontend.

### 1. Build the Frontend
Open your terminal in the root directory (where `package.json` is) and run:
```bash
npm run build
```
This creates a `dist` folder containing your optimized website.

### 2. Configure Backend to Serve Frontend
1.  Create a folder named `public` inside the `server` folder.
2.  Copy **all contents** from the `dist` folder (created in step 1) into `server/public`.
3.  Open `server/server.js` and add this code **before** the `app.listen` line:

```javascript
const path = require('path');

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

---

## Part 2: Push to GitHub

### 1. Initialize Git (if not already done)
```bash
git init
```

### 2. Create a .gitignore file
Create a file named `.gitignore` in the root directory and add:
```text
node_modules
dist
.env
.DS_Store
server/public
```

### 3. Commit Your Code
```bash
git add .
git commit -m "Initial commit for deployment"
```

### 4. Push to GitHub
1.  Create a new repository on GitHub.
2.  Copy the commands shown under "…or push an existing repository from the command line":
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Part 3: Deploy to cPanel

### 1. Create the Subdomain
1.  Log in to cPanel.
2.  Go to **Domains** or **Subdomains**.
3.  Create your subdomain (e.g., `appraisal.agropreciso.com`).
4.  Note the **Document Root** folder created (e.g., `/public_html/appraisal`).

### 2. Setup Node.js Application
1.  In cPanel, find **"Setup Node.js App"** under the Software section.
2.  Click **"Create Application"**.
3.  **Node.js Version:** Select 18.x or higher.
4.  **Application Mode:** Production.
5.  **Application Root:** Enter the path to your subdomain folder (e.g., `appraisal`).
6.  **Application URL:** Select your subdomain.
7.  **Application Startup File:** Enter `server.js`.
8.  Click **Create**.

### 3. Upload Files
1.  Go to **File Manager** in cPanel.
2.  Navigate to your application root folder (e.g., `appraisal`).
3.  **Upload** the contents of your `server` folder here.
    *   *Important:* You need `package.json`, `server.js`, the `routes` folder, `models` folder, `config` folder, and the `public` folder (containing your frontend build).
    *   *Do NOT upload `node_modules`.*
4.  Create a `.env` file in this folder and add your production environment variables:
    ```text
    PORT=8080
    NODE_ENV=production
    JWT_SECRET=your_secure_secret_here
    ```

### 4. Install Dependencies
1.  Go back to **"Setup Node.js App"**.
2.  Click the **"Run NPM Install"** button.
    *   *Note:* If this fails, you can manually upload your local `node_modules` (zipped) and extract them, but running npm install is cleaner.

### 5. Restart the App
1.  In **"Setup Node.js App"**, click **Restart Application**.
2.  Visit your subdomain URL. Your app should be live!

---

## Troubleshooting

*   **White Screen?** Check the browser console. If you see 404 errors for files, ensure the `server/public` folder contains the files from `dist`.
*   **API Errors?** Check the `passenger.log` file in your cPanel file manager (usually in the app root) for backend errors.
*   **Database:** This app uses SQLite. The database file will be created automatically in the app folder. Ensure the folder has **Write Permissions** (755 or 777) so the app can create/write to the DB file.
